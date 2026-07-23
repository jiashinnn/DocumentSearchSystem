# 🔍 OmniDoc Hybrid Search Algorithm & Calculation Logic Guide

This document provides a detailed breakdown of the Hybrid Search algorithm used in the SQL queries of `ChunkRepository.java`, including its underlying formulas, calculation steps, and parameters.

---

## 🏗️ Overall Search Architecture
OmniDoc's search is divided into **two tiers**:
1. **Tier 1 (Filename Fuzzy Match)**: Tries to match the search query against the **document name** first. If a match exceeds the similarity threshold (default `0.30`), the matches are returned instantly, bypassing the expensive semantic computation.
2. **Tier 2 (Hybrid Semantic Search)**: If the filename search finds no matches, the system falls back to a **Hybrid Search** on the document content. This combines **MiniLM vector semantic similarity** with **PostgreSQL Trigram text similarity** of the content chunks, weighting the two results to produce a final Score.

---

## 🔢 Core Algorithms & Mathematical Formulas

### 1. Trigram Similarity (`similarity`)
The PostgreSQL `pg_trgm` extension splits strings into **3-character sequences (trigrams)** to compute text similarity.
* **Formula**:
  $$\text{Similarity}(A, B) = \frac{\text{Shared Trigrams of A and B}}{\text{Total Unique Trigrams of A and B}}$$
* **Range**: `0.0` (completely different) to `1.0` (identical).
* **Base Name Optimization (Tier 1)**: To ensure searching for `aws` matches `aws.pdf` with a perfect score of `1.0`, we use `greatest()` to retrieve the maximum similarity from:
  1. `similarity(f.name, :queryText)`: Match against the full filename (e.g., `aws.pdf`).
  2. `similarity(regexp_replace(f.name, '\\.[^.]+$', ''), :queryText)`: Match against the base filename without extension (e.g., `aws`).

---

### 2. Semantic Similarity: pgvector Cosine Similarity (`<=>`)
We generate **384-dimensional dense vectors** from text chunks and user queries using the local `AllMiniLmL6V2EmbeddingModel`.
* **Vector Distance**: The `<=>` operator in pgvector represents **Cosine Distance**.
* **Cosine Similarity**: Since distance decreases as similarity increases, we compute the similarity score as:
  $$\text{SemanticScore} = 1 - (A \Leftrightarrow B)$$
* **Range**: `0.0` to `1.0`.

---

### 3. Text Fuzzy Similarity (Fuzzy Score - Tier 2)
In Tier 2, the fuzzy text similarity is calculated directly against the content chunks:
$$\text{FuzzyScore} = \text{similarity(c.chunk\_text, query)}$$
* *Note: Filename similarity is excluded in Tier 2 to prevent title keywords from dominating content matches when searching inside files.*

---

### 4. Combined Hybrid Score (Tier 2)
The final ranking score merges the **Semantic Score** and the **Fuzzy Score** using linear interpolation based on parameter $\alpha$:
$$\text{Combined Score} = \alpha \times \text{SemanticScore} + (1 - \alpha) \times \text{FuzzyScore}$$
* **$\alpha$ (Alpha)**: Defaults to `0.3`. This means:
  * **30%** of the score is based on **semantic matching** (contextual/conceptual meaning).
  * **70%** of the score is based on **keyword matching** (exact/fuzzy text matching of the content chunks).

---

## 🔍 SQL Query Breakdown (`searchHybrid`)

Here is the line-by-line explanation of the custom native query in `ChunkRepository.java`:

```sql
SELECT * FROM (
  SELECT DISTINCT ON (f.id) -- 1. Deduplicates by file ID, returning only the most relevant chunk per document
         c.id as id, 
         c.file_id as fileId, 
         f.name as docName, 
         c.chunk_text as chunkText, 
         
         -- 2. Calculates pgvector Cosine Similarity
         (1 - (c.embedding <=> cast(:queryVector as vector))) as semanticScore, 
         
         -- 3. Calculates Fuzzy text score of the content chunk
         similarity(c.chunk_text, :queryText) as fuzzyScore, 
         
         -- 4. Merges scores: Alpha * SemanticScore + (1 - Alpha) * FuzzyScore (e.g. 0.3 * Semantic + 0.7 * Fuzzy)
         ((:alpha * (1 - (c.embedding <=> cast(:queryVector as vector)))) + 
          ((1 - :alpha) * similarity(c.chunk_text, :queryText))) as score 
  FROM chunks c 
  JOIN files f ON c.file_id = f.id 
  WHERE f.status = 'ACTIVE' 
  ORDER BY f.id, score DESC -- 5. Orders inside the DISTINCT group to keep the highest matching chunk
) sub 
WHERE score >= :minScore      -- 6. Filters out low-quality results below minScore (default 0.25)
ORDER BY score DESC           -- 7. Orders the final output list from highest score to lowest
LIMIT :limitSize              -- 8. Returns only the top N results (default 5)
```

---

## 💡 Example Scenario Calculations

Assume we have the following document:
* **File A**: `aws_architecture.pdf`
* **Content Chunk**: "Amazon Web Services EC2 runs virtual servers..."

User searches: **"aws ec2"** (with default parameters: $\alpha = 0.3$, `minScore = 0.25`)

### Calculation for File A:
1. **Semantic Score (`SemanticScore`)**: The query "aws ec2" and the text "Amazon Web Services EC2 runs..." are contextually very similar. Cosine similarity calculates to **`0.85`**.
2. **Chunk Similarity (`FuzzyScore`)**: The fuzzy trigram similarity `similarity('Amazon Web Services EC2 runs virtual servers...', 'aws ec2')` returns **`0.20`**.
3. **Combined Score Calculation**:
   $$\text{Combined Score} = 0.3 \times 0.85 + 0.7 \times 0.20 = 0.255 + 0.14 = 0.395$$

### Final Result:
File A's combined score of `0.395` is greater than the `0.25` threshold, so it will be returned to the frontend and highlighted.
