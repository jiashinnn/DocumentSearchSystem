package com.OmniDoc.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SearchResultDto {
    private Long id;
    private Long fileId;
    private String docName;
    private String chunkText;
    private Double score;
    private Double semanticScore;
    private Double fuzzyScore;
}
