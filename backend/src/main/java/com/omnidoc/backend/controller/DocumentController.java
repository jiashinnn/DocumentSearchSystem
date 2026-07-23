package com.OmniDoc.backend.controller;

import com.OmniDoc.backend.dto.FileDto;
import com.OmniDoc.backend.entity.File;
import com.OmniDoc.backend.mapper.FileMapper;
import com.OmniDoc.backend.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private S3Client s3Client;

    @Value("${r2.bucket-name}")
    private String bucketName;


    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userEmail") String userEmail) {
        try {
            // Service still processes and saves the Entity
            File uploadedFile = documentService.uploadDocument(file, userEmail);

            // Map the Entity to a DTO before sending to the browser
            FileDto fileDto = FileMapper.toDto(uploadedFile);

            return ResponseEntity.ok(fileDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<java.util.List<FileDto>> getActiveDocuments() {
        java.util.List<FileDto> documents = documentService.getActiveDocuments();
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/history")
    public ResponseEntity<java.util.List<com.OmniDoc.backend.dto.RecordDto>> getHistoryLogs() {
        java.util.List<com.OmniDoc.backend.dto.RecordDto> history = documentService.getHistoryLogs();
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable("id") Long id,
            @RequestParam("userEmail") String userEmail) {
        try {
            documentService.deleteDocument(id, userEmail);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Delete failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/{id}/check")
    public ResponseEntity<?> checkFileExists(@PathVariable("id") Long id) {
        try {
            File file = documentService.getFileById(id);
            // Verify if the object exists in Cloudflare R2 using headObject metadata request
            s3Client.headObject(builder -> builder.bucket(bucketName).key(file.getPath()));
            return ResponseEntity.ok().build();
        } catch (NoSuchKeyException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Physical file does not exist on Cloudflare R2 storage.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Document metadata not found in database.");
        }
    }


    @GetMapping("/download/{id}")
    public ResponseEntity<?> downloadFile(
            @PathVariable("id") Long id,
            @RequestParam("userEmail") String userEmail) {
        try {
            File fileMetadata = documentService.getFileById(id);
            org.springframework.core.io.Resource resource = documentService.downloadDocument(id, userEmail);

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileMetadata.getName() + "\"")
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE,
                            fileMetadata.getType() != null ? fileMetadata.getType() : "application/octet-stream")
                    .body(resource);
        } catch (java.io.FileNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Download failed: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchDocuments(
            @RequestParam("query") String query,
            @RequestParam(value = "alpha", defaultValue = "0.3") Double alpha,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        try {
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Search query text cannot be empty.");
            }
            java.util.List<com.OmniDoc.backend.dto.SearchResultDto> results = documentService.searchDocuments(query,
                    alpha, limit);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Search failed: " + e.getMessage());
        }
    }

}
