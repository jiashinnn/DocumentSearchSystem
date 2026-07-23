package com.OmniDoc.backend.repository;

import com.OmniDoc.backend.entity.Chunk;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Vector;

@Repository
public interface ChunkRepository extends JpaRepository<Chunk, Long> {

        @Modifying
        @Transactional
        @Query(value = "INSERT INTO chunks (file_id, chunk_text, embedding) VALUES (:fileId, :text, cast(:vector as vector))", nativeQuery = true)
        void saveVectorChunk(@Param("fileId") Long fileId, @Param("text") String text, @Param("vector") String vector);

        // Filename Search
        @Query(value = "SELECT * FROM (" +
                        "  SELECT DISTINCT ON (f.id)" +
                        "         c.id as id, c.file_id as fileId, f.name as docName, c.chunk_text as chunkText, " +
                        "         0.0 as semanticScore, " +
                        "         greatest(similarity(f.name, :queryText), similarity(regexp_replace(f.name, '\\.[^.]+$', ''), :queryText)) as fuzzyScore, "
                        +
                        "         greatest(similarity(f.name, :queryText), similarity(regexp_replace(f.name, '\\.[^.]+$', ''), :queryText)) as score "
                        +
                        "  FROM chunks c " +
                        "  JOIN files f ON c.file_id = f.id " +
                        "  WHERE f.status = 'ACTIVE' " +
                        "  ORDER BY f.id, score DESC" +
                        ") sub " +
                        "WHERE score >= :threshold " +
                        "ORDER BY score DESC", nativeQuery = true)

        List<SearchResultProjection> searchByFilename(
                        @Param("queryText") String queryText,
                        @Param("threshold") Double threshold);

        // Hybrid Search
        @Query(value = "SELECT * FROM (" +
                        "  SELECT DISTINCT ON (f.id)" +
                        "         c.id as id, c.file_id as fileId, f.name as docName, c.chunk_text as chunkText, " +
                        "         (1 - (c.embedding <=> cast(:queryVector as vector))) as semanticScore, " + // 语义分数
                        "         similarity(c.chunk_text, :queryText) as fuzzyScore, " + // 只看内容文本，不看文件名
                        "         ((:alpha * (1 - (c.embedding <=> cast(:queryVector as vector)))) + " +
                        "          ((1 - :alpha) * similarity(c.chunk_text, :queryText))) as score " + // 混合公式
                        "  FROM chunks c " +
                        "  JOIN files f ON c.file_id = f.id " +
                        "  WHERE f.status = 'ACTIVE' " +
                        "  ORDER BY f.id, score DESC" +
                        ") sub " +
                        "WHERE score >= :minScore " +
                        "ORDER BY score DESC " +
                        "LIMIT :limitSize", nativeQuery = true)

        List<SearchResultProjection> searchHybrid(
                        @Param("queryVector") String queryVector,
                        @Param("queryText") String queryText,
                        @Param("alpha") Double alpha,
                        @Param("minScore") Double minScore,
                        @Param("limitSize") int limitSize);

        interface SearchResultProjection {
                Long getId();

                Long getFileId();

                String getDocName();

                String getChunkText();

                Double getScore();

                Double getSemanticScore();

                Double getFuzzyScore();
        }
}
