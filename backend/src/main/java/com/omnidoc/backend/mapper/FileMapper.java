package com.OmniDoc.backend.mapper;

import com.OmniDoc.backend.dto.FileDto;
import com.OmniDoc.backend.entity.File;

public class FileMapper {
    public static FileDto toDto(File file) {
        if (file == null) {
            return null;
        }
        return new FileDto(
                file.getId(),
                file.getName(),
                file.getType(),
                file.getSize(),
                file.getCreatedAt()
        );
    }
}
