# 🔍 Document Search Module: Hybrid Semantic & Trigram Search Guide

This guide details the complete design, query mechanisms, and execution flow of the **Document Search Module** in OmniDoc.

---

## 🏗️ Architectural Overview
OmniDoc implements a robust, two-tiered search pipeline. If a search query strongly matches a document title, it directly returns those matches (Tier 1). Otherwise, it falls back to a hybrid algorithm combining semantic vector similarity with text chunk fuzzy similarity (Tier 2):

$$\text{Search Input} \rightarrow \text{Vite Client (Fetch)} \rightarrow \text{Spring Controller} \rightarrow \text{Embed Search Query (MiniLM)} \rightarrow \text{PostgreSQL (Trigram/pgvector)} \rightarrow \text{Merged Rank DTOs} \rightarrow \text{Search UI Grid}$$

---

## 🏢 Summary of Module Components

| Layer | File in Project | Technical Duty |
| :--- | :--- | :--- |
| **1. Database Schema** | `chunks`, `files` tables | Stores document relationships and text segments mapped to 384-dimensional vectors. |
| **2. Repository Layer** | [ChunkRepository.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/repository/ChunkRepository.java) | Executes native SQL queries with Custom Trigram scoring and pgvector similarity (`<=>` operator). |
| **3. Service Layer** | [DocumentServiceImpl.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/service/impl/DocumentServiceImpl.java) | Implements two-tier logic: runs Title-matching first, else generates query embeddings and performs hybrid searches. |
| **4. Web Controller** | [DocumentController.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/controller/DocumentController.java) | Exposes `GET /api/documents/search` accepting `query`, `alpha`, and `limit` parameters. |
| **5. Frontend Client** | [SearchView.tsx](file:///c:/Documents/Github/DocumentSearchSystem/frontend/src/components/SearchView.tsx) | Dispatches search requests on Enter/Click, maps highlights in snippets, and renders custom tables. |

---

## 🔍 Detailed Component Analysis

### 1. Database Configuration
To enable the dual text and vector indexing:
*   **pgvector Extension**: Loaded to support the 384-dimension `embedding` column (using `AllMiniLmL6V2EmbeddingModel`).
*   **pg_trgm Extension**: Enabled (`CREATE EXTENSION IF NOT EXISTS pg_trgm;`) to support Trigram-based fuzzy string similarity matching on document names and chunk texts.

---

### 2. Repository Layer & Custom Search Queries (`ChunkRepository.java`)

We utilize native PostgreSQL queries to calculate both fuzzy string similarities and vector cosine distances directly inside the database for maximum performance.

#### Tier 1: Filename Trigram Matching (`searchByFilename`)
```java
@Query(value = "SELECT * FROM (" +
        "  SELECT DISTINCT ON (f.id)" +
        "         c.id as id, c.file_id as fileId, f.name as docName, c.chunk_text as chunkText, " +
        "         0.0 as semanticScore, " +
        "         similarity(f.name, :queryText) as fuzzyScore, " +
        "         similarity(f.name, :queryText) as score " +
        "  FROM chunks c " +
        "  JOIN files f ON c.file_id = f.id " +
        "  WHERE f.status = 'ACTIVE' " +
        "  ORDER BY f.id, score DESC" +
        ") sub " +
        "WHERE score >= :threshold " +
        "ORDER BY score DESC",
        nativeQuery = true)
List<SearchResultProjection> searchByFilename(
        @Param("queryText") String queryText,
        @Param("threshold") Double threshold);
```
*   **Mechanic**: Computes `similarity(f.name, :queryText)` using trigrams. If the match score exceeds the threshold (default: `0.30` or 30%), the document is matched instantly by title.

#### Tier 2: Hybrid Content & Semantic Search (`searchHybrid`)
```java
@Query(value = "SELECT * FROM (" +
        "  SELECT DISTINCT ON (f.id)" +
        "         c.id as id, c.file_id as fileId, f.name as docName, c.chunk_text as chunkText, " +
        "         (1 - (c.embedding <=> cast(:queryVector as vector))) as semanticScore, " +
        "         ((0.7 * similarity(f.name, :queryText)) + (0.3 * similarity(c.chunk_text, :queryText))) as fuzzyScore, " +
        "         ((:alpha * (1 - (c.embedding <=> cast(:queryVector as vector)))) + " +
        "          ((1 - :alpha) * ((0.7 * similarity(f.name, :queryText)) + (0.3 * similarity(c.chunk_text, :queryText))))) as score " +
        "  FROM chunks c " +
        "  JOIN files f ON c.file_id = f.id " +
        "  WHERE f.status = 'ACTIVE' " +
        "  ORDER BY f.id, score DESC" +
        ") sub " +
        "WHERE score >= :minScore " +
        "ORDER BY score DESC " +
        "LIMIT :limitSize",
        nativeQuery = true)
List<SearchResultProjection> searchHybrid(
        @Param("queryVector") String queryVector,
        @Param("queryText") String queryText,
        @Param("alpha") Double alpha,
        @Param("minScore") Double minScore,
        @Param("limitSize") int limitSize);
```
*   **Semantic Score**: Computed as the cosine similarity `1 - (c.embedding <=> cast(:queryVector as vector))`.
*   **Fuzzy Score**: A weighted combination of title match similarity and content chunk similarity:
    $$\text{Fuzzy Score} = 0.7 \times \text{similarity(file\_name, query)} + 0.3 \times \text{similarity(chunk\_text, query)}$$
*   **Combined Score**: Linearly interpolates the Semantic and Fuzzy scores based on parameter $\alpha$:
    $$\text{Score} = \alpha \times \text{Semantic Score} + (1 - \alpha) \times \text{Fuzzy Score}$$
    *(By default, $\alpha = 0.7$ gives high precedence to the semantic vector logic).*

---

### 3. Service Layer Pipeline (`DocumentServiceImpl.java`)

When the `searchDocuments` service method is executed:
1.  **Tier 1 Execution**: Evaluates whether any active document names match the query string with a similarity threshold of `0.30`.
2.  **Tier 2 Execution**: If no matches are found, it generates a query vector embedding (using `AllMiniLmL6V2EmbeddingModel`) and sends it to the custom hybrid database search.
3.  **Result Projection Mapping**: Projects matching rows to `SearchResultDto` objects, logging details to the console:
    ```
    >>> [SEARCH MATCH] File: 'Resume.pdf' | Combined Score: 0.785 (Semantic: 0.812, Fuzzy: 0.722)
    ```

---

### 4. Controller Layer (`DocumentController.java`)
Exposes the `/api/documents/search` endpoint via GET.
*   **Input parameters**:
    *   `query` (required): The search terms.
    *   `alpha` (default `0.7`): Control parameter weighting semantic search vs text trigram matching.
    *   `limit` (default `5`): Maximum matches to return.
*   Returns `200 OK` with a JSON array of `SearchResultDto`.

---

### 5. Frontend Client (`SearchView.tsx`)
The frontend binds the UI search actions directly to the hybrid search pipeline:
*   **Trigger**: Pressing `Enter` in the search bar or typing keywords triggers the `executeSearch()` function.
*   **API Dispatch**:
    ```typescript
    const response = await fetch(`http://localhost:8080/api/documents/search?query=${encodeURIComponent(searchQuery)}&alpha=0.7&limit=5`);
    ```
*   **Snippet Rendering**: Renders search results matching the payload. If the match contains chunk snippets (Tier 2/3), it presents the text segment directly under the document name.
*   **Text Highlighting**: The client runs a regular expression splitter (`highlightText()`) that wraps keywords found in the title or the text snippet in a yellow `<mark>` badge for improved readability.
