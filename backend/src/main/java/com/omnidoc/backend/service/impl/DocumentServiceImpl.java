// This is Document Service Implementation
// where I will use the Apache Tika parser, the LangChain4j paragraph splitter and the local embedding generator.
package com.OmniDoc.backend.service.impl;

import com.OmniDoc.backend.entity.File;
import com.OmniDoc.backend.entity.User;
import com.OmniDoc.backend.entity.Record;
import com.OmniDoc.backend.repository.ChunkRepository;
import com.OmniDoc.backend.repository.FileRepository;
import com.OmniDoc.backend.repository.RecordRepository;
import com.OmniDoc.backend.repository.UserRepository;
import com.OmniDoc.backend.service.DocumentService;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.splitter.DocumentByParagraphSplitter;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import jakarta.transaction.Transactional;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.util.Matrix;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.logging.Logger;
import java.util.logging.Level;

@Service
public class DocumentServiceImpl implements DocumentService {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private ChunkRepository chunkRepository;

    @Autowired
    private RecordRepository recordRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${file.upload.dir}")
    private String uploadDir;

    private final EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();
    private final Tika tika = new Tika();
    private static final Logger log = Logger.getLogger(DocumentServiceImpl.class.getName());

    @Autowired
    private S3Client s3Client;

    @Value("${r2.bucket-name}")
    private String bucketName;

    @Override
    @Transactional
    public File uploadDocument(MultipartFile file, String userEmail) throws IOException {
        String originalFilename = file.getOriginalFilename();

        if (originalFilename == null) {
            throw new IllegalArgumentException("Invalid file name.");
        }
        long maxSizeBytes = 50 * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("File size exceeds the maximum limit of 50MB!");
        }
        log.info(">>> [UPLOAD] Starting file upload process. File: " + originalFilename + ", User: " + userEmail);

        // Check only accept text-based doc
        // FIRST DECLARATION OF extension
        String extension = getFileExtension(originalFilename).toLowerCase();
        List<String> allowedExtensions = Arrays.asList("txt", "pdf", "docx", "xlsx", "pptx");
        if (!allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException("Only text-based files (.txt, .pdf, .docx, .xlsx, .pptx) are allowed!");
        }

        // Check unique name only among ACTIVE files
        Optional<File> existingFileOpt = fileRepository.findByNameAndStatus(originalFilename, "ACTIVE");
        if (existingFileOpt.isPresent()) {
            log.warning(">>> [UPLOAD] Duplicate filename check failed. File already exists and is ACTIVE.");
            throw new IllegalArgumentException("A file named '" + originalFilename + "' already exists!");
        }

        // REUSE the extension variable (do not write "String extension" again)
        // Generate a unique name for physical disk storage
        String uniqueDiskName = java.util.UUID.randomUUID().toString() + "." + extension;

        // Save to storage folder under the UNIQUE disk name
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path targetPath = uploadPath.resolve(uniqueDiskName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String uniqueKey = java.util.UUID.randomUUID().toString() + "." + extension;

        s3Client.putObject(builder -> builder
                .bucket(bucketName)
                .key(uniqueKey)
                .contentType(file.getContentType()),
                software.amazon.awssdk.core.sync.RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        // Save metadata to database: File table
        File dbFile = new File();
        dbFile.setName(originalFilename); // Keep original display name
        dbFile.setType(file.getContentType());
        dbFile.setSize(file.getSize());
        dbFile.setPath(uniqueKey);
        dbFile.setStatus("ACTIVE");
        dbFile.setCreatedAt(LocalDateTime.now());
        dbFile = fileRepository.save(dbFile);

        // Extract content using Apache Tika
        String extractedText;
        try (java.io.InputStream is = file.getInputStream()) {
            // log.info(">>> [TIKA] Extracting text content from file...");
            extractedText = tika.parseToString(is);
            // log.info(">>> [TIKA] Successfully extracted {} characters of text.",
            // extractedText != null ? extractedText.length() : 0);
        } catch (Exception e) {
            // log.error(">>> [TIKA] Failed to extract text: ", e);
            throw new RuntimeException("Failed to extract text from file: " + e.getMessage());
        }

        // Clean and Chunk using LongChain4j Semantic Chunker, split by paragraphs
        if (extractedText != null && !extractedText.trim().isEmpty()) {
            Document document = Document.from(extractedText);
            List<TextSegment> segments = new DocumentByParagraphSplitter(300, 30).split(document);
            // log.info(">>> [CHUNKER] Text split into {} raw segments.", segments.size());

            List<String> cleanChunks = segments.stream()
                    .map(TextSegment::text)
                    .map(String::trim)
                    .filter(text -> text.length() >= 10)
                    .distinct()
                    .collect(Collectors.toList());

            // log.info(">>> [CHUNKER] Deduplicated & cleaned. Total chunks to embed: {}",
            // cleanChunks.size());
            // log.info(">>> [EMBEDDING] Vectorizing chunks using MiniLM model...");

            // Convert chunks to vector embeddings and store in PostgresSQL
            int chunkIndex = 1;
            for (String chunkText : cleanChunks) {
                float[] vector = embeddingModel.embed(chunkText).content().vector();
                String vectorString = Arrays.toString(vector);
                // Call repository query to cast vector and insert
                chunkRepository.saveVectorChunk(dbFile.getId(), chunkText, vectorString);
                // log.info(">>> [EMBEDDING] Vectorized & saved Chunk #{}/{} (Length: {}
                // chars)",
                // chunkIndex++, cleanChunks.size(), chunkText.length());
            }
        } else {
            // log.warn(">>> [CHUNKER] Document has no readable text content. Skipped
            // chunking.");
        }

        // Save to Record table
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User context not found."));
        Record auditRecord = new Record();
        auditRecord.setFile(dbFile);
        auditRecord.setUser(user);
        auditRecord.setAction("Uploaded");
        auditRecord.setDateAction(LocalDateTime.now());
        recordRepository.save(auditRecord);

        // log.info(">>> [AUDIT] Saved audit log. Upload complete for file ID: {}",
        // dbFile.getId());

        return dbFile;
    }

    private String getFileExtension(String fileName) {
        int lastIndex = fileName.lastIndexOf('.');
        return (lastIndex == -1) ? "" : fileName.substring(lastIndex + 1);
    }

    @Override
    public List<com.OmniDoc.backend.dto.FileDto> getActiveDocuments() {
        return fileRepository.findAllByStatusOrderByCreatedAtDesc("ACTIVE")
                .stream()
                .map(com.OmniDoc.backend.mapper.FileMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<com.OmniDoc.backend.dto.RecordDto> getHistoryLogs() {
        return recordRepository.findAllByOrderByDateActionDesc()
                .stream()
                .map(com.OmniDoc.backend.mapper.RecordMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteDocument(Long id, String userEmail) {
        // Fetch file
        File file = fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found."));

        // Soft-delete: update status field to INACTIVE
        file.setStatus("INACTIVE");
        fileRepository.save(file);

        // Retrieve user context
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User context not found."));

        // Save record to Database
        Record auditRecord = new Record();
        auditRecord.setFile(file);
        auditRecord.setUser(user);
        auditRecord.setAction("Deleted");
        auditRecord.setDateAction(LocalDateTime.now());
        recordRepository.save(auditRecord);
    }

    @Override
    public File getFileById(Long id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found."));
    }

    @Override
    @Transactional
    public org.springframework.core.io.Resource downloadDocument(Long id, String userEmail)
            throws java.io.FileNotFoundException {
        File file = fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found."));
        // Retrieve user details from database
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User context not found."));
        // Save record to database
        Record auditRecord = new Record();
        auditRecord.setFile(file);
        auditRecord.setUser(user);
        auditRecord.setAction("Downloaded");
        auditRecord.setDateAction(LocalDateTime.now());
        recordRepository.save(auditRecord);
        // 1. Download file bytes directly from Cloudflare R2 bucket
        byte[] fileBytes;
        try {
            software.amazon.awssdk.core.ResponseBytes<software.amazon.awssdk.services.s3.model.GetObjectResponse> objectBytes = s3Client
                    .getObjectAsBytes(builder -> builder.bucket(bucketName).key(file.getPath()));
            fileBytes = objectBytes.asByteArray();
        } catch (Exception e) {
            log.log(Level.SEVERE, "Failed to download file from Cloudflare R2 key: " + file.getPath(), e);
            throw new java.io.FileNotFoundException("File not found on cloud storage: " + file.getPath());
        }
        String extension = getFileExtension(file.getName()).toLowerCase();
        // 2. PDF Watermarking using the memory byte array
        if ("pdf".equals(extension)) {
            try {
                String watermarkText = user.getName() + " (" + user.getEmail() + ")";
                byte[] watermarkedBytes = addWatermarkToPdf(fileBytes, watermarkText);
                return new org.springframework.core.io.ByteArrayResource(watermarkedBytes);
            } catch (Exception e) {
                log.log(Level.SEVERE, "Failed to apply PDF watermark, falling back to original", e);
            }
        }
        // 3. Plain Text (.txt) Watermarking
        if ("txt".equals(extension)) {
            try {
                // Convert download bytes to string
                String originalText = new String(fileBytes, java.nio.charset.StandardCharsets.UTF_8);
                // Construct a security watermark header
                String timestamp = LocalDateTime.now()
                        .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                String watermarkBanner = String.format(
                        "========================================================================\n" +
                                "                        CONFIDENTIAL DOCUMENT\n" +
                                "  Downloaded By: %s (%s)\n" +
                                "  Download Date: %s\n" +
                                "  WARNING: Unauthorized distribution of this file is strictly prohibited.\n" +
                                "========================================================================\n\n",
                        user.getName(), user.getEmail(), timestamp);
                String watermarkedText = watermarkBanner + originalText;
                return new org.springframework.core.io.ByteArrayResource(
                        watermarkedText.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            } catch (Exception e) {
                log.log(Level.SEVERE, "Failed to apply TXT watermark, falling back to original", e);
            }
        }
        // 4. Default fallback: Stream non-watermarked original file bytes (.docx,
        // .xlsx, .pptx)
        return new org.springframework.core.io.ByteArrayResource(fileBytes);
    }

    private byte[] addWatermarkToPdf(byte[] pdfBytes, String watermarkText) throws IOException {
        // Load PDF directly from the byte array in memory (PDFBox 3.x)
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            for (PDPage page : document.getPages()) {
                float width = page.getMediaBox().getWidth();
                float height = page.getMediaBox().getHeight();
                try (PDPageContentStream contentStream = new PDPageContentStream(
                        document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

                    // Transparency (12% opacity)
                    PDExtendedGraphicsState graphicsState = new PDExtendedGraphicsState();
                    graphicsState.setNonStrokingAlphaConstant(0.12f);
                    contentStream.setGraphicsStateParameters(graphicsState);

                    // Set Font and Color
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 22);
                    contentStream.setNonStrokingColor(new java.awt.Color(150, 150, 150));

                    // Grid Coordinates
                    float[] xCoords = { width * 0.15f, width * 0.50f, width * 0.85f };
                    float[] yCoords = { height * 0.15f, height * 0.50f, height * 0.85f };
                    float rad = (float) Math.toRadians(45);
                    float cos = (float) Math.cos(rad);
                    float sin = (float) Math.sin(rad);

                    // Render the 9 watermarks
                    for (float x : xCoords) {
                        for (float y : yCoords) {
                            contentStream.saveGraphicsState();
                            contentStream.beginText();
                            contentStream.setTextMatrix(new Matrix(cos, sin, -sin, cos, x, y));
                            contentStream.showText(watermarkText);
                            contentStream.endText();
                            contentStream.restoreGraphicsState();
                        }
                    }
                }
            }
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    @Override
    public List<com.OmniDoc.backend.dto.SearchResultDto> searchDocuments(String queryText, Double alpha, int limit) {
        double filenameThreshold = 0.30; // 30% filename match threshold (Tier 1)
        double minScoreCutoff = 0.25; // 25% minimum combined score cutoff (Tier 3)
        // Attempt Filename-only match first
        List<ChunkRepository.SearchResultProjection> filenameMatches = chunkRepository.searchByFilename(queryText,
                filenameThreshold);
        List<ChunkRepository.SearchResultProjection> finalProjections;
        if (!filenameMatches.isEmpty()) {
            log.info(">>> [SEARCH] [TIER 1] Filename match triggered for query: '" + queryText + "'. Found "
                    + filenameMatches.size() + " matches.");
            finalProjections = filenameMatches;
        } else {
            // Fallback to Hybrid (Semantic + Fuzzy) Search
            log.info(
                    ">>> [SEARCH] [TIER 2] No filename match. Running Hybrid Semantic Search for: '" + queryText + "'");
            float[] queryVector = embeddingModel.embed(queryText).content().vector();
            String queryVectorString = Arrays.toString(queryVector);
            finalProjections = chunkRepository.searchHybrid(queryVectorString, queryText, alpha, minScoreCutoff, limit);
        }
        // Print scores to terminal and map to DTOs
        return finalProjections.stream()
                .map(p -> {
                    log.info(">>> [SEARCH MATCH] File: '" + p.getDocName() + "' | Combined Score: " +
                            String.format("%.3f", p.getScore()) + " (Semantic: " +
                            String.format("%.3f", p.getSemanticScore()) + ", Fuzzy: " +
                            String.format("%.3f", p.getFuzzyScore()) + ")");

                    return new com.OmniDoc.backend.dto.SearchResultDto(
                            p.getId(),
                            p.getFileId(),
                            p.getDocName(),
                            p.getChunkText(),
                            p.getScore(),
                            p.getSemanticScore(),
                            p.getFuzzyScore());
                })
                .collect(Collectors.toList());
    }

}
