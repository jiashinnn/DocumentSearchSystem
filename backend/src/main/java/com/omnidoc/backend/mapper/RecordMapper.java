package com.OmniDoc.backend.mapper;

import com.OmniDoc.backend.dto.RecordDto;
import com.OmniDoc.backend.entity.Record;

public class RecordMapper {

    public static RecordDto toDto(Record record) {
        if (record == null) {
            return null;
        }
        return new RecordDto(
                record.getId(),
                record.getFile() != null ? record.getFile().getName() : "Deleted File",
                record.getAction(),
                record.getUser() != null ? record.getUser().getEmail() : "Unknown User",
                record.getDateAction()
        );
    }
}
