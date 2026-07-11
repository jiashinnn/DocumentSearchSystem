package com.OmniDoc.backend.service;

import com.OmniDoc.backend.dto.FileDto;
import com.OmniDoc.backend.entity.File;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface DocumentService {

    File uploadDocument(MultipartFile file, String userEmail) throws IOException;

    List<FileDto> getActiveDocuments();

    List<com.OmniDoc.backend.dto.RecordDto> getHistoryLogs();

    void deleteDocument(Long id, String userEmail);

    File getFileById(Long id);

    org.springframework.core.io.Resource downloadDocument(Long id, String userEmail) throws java.io.FileNotFoundException;

    List<com.OmniDoc.backend.dto.SearchResultDto> searchDocuments(String queryText, Double alpha, int limit);
}
