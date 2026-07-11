# 🗑️ Document Delete Module: Soft-Delete Architecture Guide

This guide details the design, rationale, and implementation details of the **Document Deletion and Soft-Delete System** in OmniDoc.

---

## 🏗️ Architectural Overview
To protect history trails and database referential integrity, OmniDoc uses a **Soft-Delete (Logical Deletion)** pattern instead of a Hard-Delete (Physical SQL `DELETE`).

$$\text{User Click Delete} \rightarrow \text{Fetch DELETE Request} \rightarrow \text{Spring Controller} \rightarrow \text{Update status = 'INACTIVE'} \rightarrow \text{Log Audit Record} \rightarrow \text{Filter UI List}$$

---

## 🏢 Summary of Module Components

| Layer | File in Project | Technical Duty |
| :--- | :--- | :--- |
| **1. Database Status** | `files` table | Column `status` stores `'ACTIVE'` or `'INACTIVE'`. |
| **2. Repository Filter** | [FileRepository.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/repository/FileRepository.java) | Restricts selects to retrieve only `'ACTIVE'` documents. |
| **3. Service Logic** | [DocumentServiceImpl.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/service/impl/DocumentServiceImpl.java) | Updates status, saves Entity, and creates a `"Deleted"` audit record. |
| **4. Web Controller** | [DocumentController.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/controller/DocumentController.java) | Listens for DELETE requests at `/api/documents/{id}`. |
| **5. Frontend Handler** | [SearchView.tsx](file:///c:/Documents/Github/DocumentSearchSystem/frontend/src/components/SearchView.tsx) | Handles single delete click, triggers parallel fetches for bulk selection, updates React list. |

---

## 🔍 Detailed Component Analysis

### 1. Why Soft-Delete over Hard-Delete?
In standard business applications, running a physical SQL `DELETE FROM files WHERE id = ?` creates severe problems:
1.  **Orphaned Records**: If a document is deleted physically, all its vector chunks in `vector_chunks` and activity logs in `records` lose their foreign key reference, throwing SQL Constraint Errors.
2.  **Audit Integrity**: If a file is deleted, we must still be able to prove who uploaded and downloaded it in the historical audit logs. If the file record is gone, the logs become broken.
3.  **The Solution**: We keep the row in the database, but change its `status` column to `'INACTIVE'`. It becomes invisible to search lists, but preserves all relationship keys.

---

### 2. Repository Filters (`FileRepository.java`)
To ensure inactive documents never appear in search queries or lists, we filter them at the database selection level:
```java
@Repository
public interface FileRepository extends JpaRepository<File, Long> {
    
    // Retrieves only files matching status 'ACTIVE'
    List<File> findAllByStatusOrderByCreatedAtDesc(String status);
    
    Optional<File> findByNameAndStatus(String name, String status);
}
```
*   When fetching documents, the service calls `findAllByStatusOrderByCreatedAtDesc("ACTIVE")`. Any document marked `'INACTIVE'` is automatically filtered out.

---

### 3. Service Implementation (`DocumentServiceImpl.java`)
The delete operation performs two actions inside a `@Transactional` block:
```java
@Override
@Transactional
public void deleteDocument(Long id, String userEmail) {
    // 1. Fetch the file metadata
    File file = fileRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Document not found."));

    // 2. Mark status as INACTIVE
    file.setStatus("INACTIVE");
    fileRepository.save(file);

    // 3. Retrieve user context and write "Deleted" audit record
    User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User context not found."));

    Record auditRecord = new Record();
    auditRecord.setFile(file);
    auditRecord.setUser(user);
    auditRecord.setAction("Deleted");
    auditRecord.setDateAction(LocalDateTime.now());
    recordRepository.save(auditRecord);
}
```

---

### 4. Controller Layer
Exposes the `@DeleteMapping("/{id}")` endpoint. It parses the path variable `id` and parameters:
*   `DELETE http://localhost:8080/api/documents/{id}?userEmail={email}`

---

### 5. Frontend Single and Bulk Deletion (`SearchView.tsx`)

#### A. Single Delete (`handleDelete`)
Triggers a confirmation box. On approval, fires a DELETE request. If successful, filters the state array locally:
```typescript
setDocuments(prev => prev.filter(doc => doc.id !== id));
```

#### B. Bulk Delete (`handleBulkDelete`)
When multiple checkboxes are checked, bulk delete fires all database delete requests **concurrently in parallel** using **`Promise.all`** to maximize speed:
```typescript
await Promise.all(
  docsToDelete.map(doc =>
    fetch(`http://localhost:8080/api/documents/${doc.id}?userEmail=${currentUser?.email || ""}`, {
      method: "DELETE",
    })
  )
);
```
Once all API calls return `200 OK`, it clears the checkboxes, alerts the user, and triggers local React state filters.
