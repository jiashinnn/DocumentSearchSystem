package com.OmniDoc.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecordDto {
    private Long id;
    private String docName;
    private String action;
    private String userEmail;
    private LocalDateTime dateAction;
}
