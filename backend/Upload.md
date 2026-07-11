# 📤 Document Upload Module: Architecture & Logic Guide

This guide details the complete flow of the **Document Upload and Vectorization Pipeline** in OmniDoc, tracing data from the Frontend to PostgreSQL Vector Database.

---

## 🏗️ Architectural Overview
The upload process uses a state-of-the-art **Retrieval-Augmented Generation (RAG)** pipeline. Here is the step-by-step journey:

$$\text{File Drag \& Drop} \rightarrow \text{Vite Client (FormData)} \rightarrow \text{Spring Controller} \rightarrow \text{Tika Parser} \rightarrow \text{LangChain4j Chunker} \rightarrow \text{Local Embedding} \rightarrow \text{PostgreSQL (pgvector)}$$

---

## 🏢 Summary of Module Components

| Layer | File in Project | Technical Duty |
| :--- | :--- | :--- |
| **1. Database Schema** | `files`, `vector_chunks` | Stores file metadata and 384-dimensional dense vectors. |
| **2. Repository Layer** | [FileRepository](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/repository/FileRepository.java), `ChunkRepository` | Manages file table and inserts embeddings using native SQL casts. |
| **3. Data Transfer (DTO)** | `FileDto.java` | Standardizes response details (name, size, timestamp) sent to browser. |
| **4. Mapper** | `FileMapper.java` | Translates the database File Entity to the lightweight File DTO. |
| **5. Service (The Brain)** | [DocumentServiceImpl.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/service/impl/DocumentServiceImpl.java) | Validates rules, runs Tika, generates chunks, calculates embeddings. |
| **6. Web Controller** | [DocumentController.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/controller/DocumentController.java) | Listens for POST multipart requests at `/api/documents/upload`. |
| **7. Frontend Client** | [SearchView.tsx](file:///c:/Documents/Github/DocumentSearchSystem/frontend/src/components/SearchView.tsx) | Handles file inputs, filters size, posts `FormData`, and appends UI. |

---

## 🔍 Detailed Component Analysis

### 1. Database & Schema
We store document metadata separate from their vectorized semantic chunks:
*   **`files` table**: Holds the main file properties (ID, name, original mime-type, absolute storage path, status `'ACTIVE'` or `'INACTIVE'`).
*   **`vector_chunks` table**: Stores chunked text fragments. The `embedding` column uses the PostgreSQL **`vector(384)`** type.
*   **Prerequisite**: Run `CREATE EXTENSION IF NOT EXISTS vector;` in PostgreSQL first to enable the semantic vector type.

---

### 2. Repository Layer & Custom pgvector Casting
Because Spring Data JPA / Hibernate does not natively support the PostgreSQL `vector` data type, we handle vector insertion using a **native SQL custom query** in `ChunkRepository.java`:
```java
@Query(value = "INSERT INTO vector_chunks (file_id, chunk_text, embedding) " +
               "VALUES (:fileId, :chunkText, cast(:embedding as vector))", 
       nativeQuery = true)
void saveVectorChunk(@Param("fileId") Long fileId, 
                     @Param("chunkText") String chunkText, 
                     @Param("embedding") String embeddingString);
```
*   **The Pro Trick**: We generate the vector float array in Java, convert it to a string format (e.g. `"[0.12, -0.45, 0.78...]"`), and pass it to PostgreSQL. The `cast(:embedding as vector)` instruction forces the database to parse the string into a binary vector structure.

---

### 3. Service Layer Pipeline (`DocumentServiceImpl.java`)
When a file is uploaded, the service runs these sequential tasks:

#### Task A: Size & Type Verification
*   It rejects files that exceed **10MB** (`file.getSize() > 10 * 1024 * 1024`) to protect server memory.
*   It checks the file extension against a whitelist: `.txt`, `.pdf`, `.docx`, `.xlsx`, `.pptx`.

#### Task B: Physical Save
*   The file stream is copied directly to a local directory (`uploads/` folder in the project root) using `Files.copy` with `REPLACE_EXISTING`.

#### Task C: Text Extraction (Apache Tika)
*   Instead of manually writing text extraction code for each file format, we call **Apache Tika**:
    ```java
    String extractedText = tika.parseToString(targetPath);
    ```
    Tika automatically parses and returns standard plain text strings from PDFs, Word docs, Excel sheets, and slides.

#### Task D: Semantic Chunking (LangChain4j)
*   A single document could have thousands of words. We split the document into clean paragraphs using LangChain4j:
    ```java
    List<TextSegment> segments = new DocumentByParagraphSplitter(300, 30).split(document);
    ```
    This chunks the text by paragraphs (max 300 tokens per chunk, with 30 tokens overlap to maintain paragraph context).

#### Task E: Embedding Generation
*   Each text chunk is sent to the local **`AllMiniLmL6V2EmbeddingModel`**:
    ```java
    float[] vector = embeddingModel.embed(chunkText).content().vector();
    ```
    This generates a 384-dimensional mathematical vector (a dense representation of semantic meaning) for the chunk without needing an internet connection or OpenAI API keys.

#### Task F: Audit Log Write
*   Saves a record to the `records` table with action `"Uploaded"`.

---

### 4. Controller Layer
Exposes the `/api/documents/upload` HTTP POST endpoint. It:
*   Receives `MultipartFile file` and `String userEmail`.
*   Invokes the service layer inside a `@Transactional` boundary (if chunking fails, the database automatically rolls back).
*   Maps the saved file entity to `FileDto` using `FileMapper.toDto()` and returns `200 OK`.

---

### 5. Frontend Client (`SearchView.tsx`)
*   **File Input**: Triggers file browser through a hidden HTML input (`<input type="file" ref={fileInputRef} className="hidden" />`).
*   **Immediate checks**: Validates file size (under 10MB) and whitelisted extensions before uploading.
*   **Form Construction**: Puts the file binary and the dynamic logged-in user email into a `FormData` object:
    ```typescript
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userEmail", currentUser?.email || "");
    ```
*   **HTTP Post**: Sends the form to the backend, parses the returned `FileDto` JSON, adds the file to the React active document state list, and registers an activity log entry.
