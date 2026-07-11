package com.OmniDoc.backend.repository;

import com.OmniDoc.backend.entity.File;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<File,Long> {

    Optional<File> findByNameAndStatus(String name,String status);

    List<File> findAllByStatusOrderByCreatedAtDesc(String status);
}
