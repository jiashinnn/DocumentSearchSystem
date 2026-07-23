# 📊 Activity & History Log Module: Architecture & Logic Guide

This guide details the design, data mapping, and execution flow of the **Document Activity History and Audit Logging Module** in OmniDoc.

---

## 🏗️ Architectural Overview
Every write action (Upload, Download, Deletion) is permanently logged to an audit trail database. This trail is exposed as a live feed in the frontend History tab:

$$\text{Database Action Event} \rightarrow \text{Save Audit Record} \rightarrow \text{GET /history Endpoint} \rightarrow \text{RecordMapper} \rightarrow \text{JSON DTO List} \rightarrow \text{HistoryView Grid}$$

---

## 🏢 Summary of Module Components

| Layer | File in Project | Technical Duty |
| :--- | :--- | :--- |
| **1. Database Schema** | `records` table | Column schema mapping relationships to `users` and `files`. |
| **2. JPA Entity** | `Record.java` | Maps the database row, holding `@ManyToOne` foreign key references. |
| **3. Repository** | [RecordRepository.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/repository/RecordRepository.java) | Exposes `findAllByOrderByDateActionDesc()` sorting queries. |
| **4. Mapper** | [RecordMapper.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/mapper/RecordMapper.java) | Translates complex relational Entity trees into clean, flat JSON DTOs. |
| **5. Controller** | [DocumentController.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/controller/DocumentController.java) | Exposes `GET /api/documents/history` endpoint. |
| **6. Frontend Client** | [App.tsx](file:///c:/Documents/Github/DocumentSearchSystem/frontend/src/App.tsx), [HistoryView.tsx](file:///c:/Documents/Github/DocumentSearchSystem/frontend/src/components/HistoryView.tsx) | Fetches backend records, maps dates, renders dynamic action badges. |

---

## 🔍 Detailed Component Analysis

### 1. Database Schema & Entity Relationships
The **`records`** table tracks history events:
*   `id`: Primary key (auto-incrementing bigint).
*   `action`: String descriptor (enum-like values: `'Uploaded'`, `'Downloaded'`, `'Deleted'`).
*   `date_action`: Timestamp representing when the event occurred.
*   `file_id`: Foreign key reference to the `files` table.
*   `user_id`: Foreign key reference to the `users` table.

#### JPA Mappings (`Record.java`):
To enable JPA to resolve connections, we establish `@ManyToOne` relationships:
```java
@ManyToOne
@JoinColumn(name = "file_id")
private File file;

@ManyToOne
@JoinColumn(name = "user_id")
private User user;
```

---

### 2. The Repository Layer (`RecordRepository.java`)
We query the logs sorted by timestamp so the user sees the **newest activity first**:
```java
List<Record> findAllByOrderByDateActionDesc();
```

---

### 3. Mapper Layer & Null-Safety Translation (`RecordMapper.java`)
Since Java Entities are complex relational objects, we convert them into a flat **`RecordDto`** structure before sending them as JSON:
```java
public static RecordDto toDto(Record record) {
    if (record == null) return null;
    return new RecordDto(
        record.getId(),
        record.getFile() != null ? record.getFile().getName() : "Deleted File",
        record.getAction(),
        record.getUser() != null ? record.getUser().getEmail() : "Unknown User",
        record.getDateAction()
    );
}
```
*   **The Pro Detail**: If a file was deleted (logical soft delete), we check `record.getFile() != null`. If it is null or soft-deleted, we return `"Deleted File"` as a fallback to prevent runtime `NullPointerExceptions` while keeping the log intact.

---

### 4. Controller Layer
Exposes the `GET /api/documents/history` endpoint returning a JSON array of `RecordDto` objects.

---

### 5. Frontend Client (`App.tsx` & `HistoryView.tsx`)

#### A. Triggering the Fetch (`App.tsx`)
In `App.tsx`, we fetch the history logs inside a `useEffect` hook that triggers **whenever the view or search tab changes**:
```typescript
  const fetchHistoryLogs = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/documents/history");
      if (response.ok) {
        const data = await response.json();
        const mappedLogs = data.map((log: any) => ({
          id: log.id.toString(),
          docName: log.docName,
          action: log.action,
          user: log.userEmail,
          date: new Date(log.dateAction).toLocaleString('en-GB') // Standardize locale format
        }));
        setHistoryLogs(mappedLogs);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (view === 'search') {
      fetchHistoryLogs();
    }
  }, [view, searchTab]);
```

#### B. Component Rendering & Badge UI (`HistoryView.tsx`)
`HistoryView.tsx` accepts the mapped `logs` as props and provides filters:
*   **Search Input**: Filters logs dynamically by document name.
*   **Action Dropdown**: Filters by log action (All, Uploaded, Downloaded, Deleted).
*   **Dynamic Styling**: Applies colored badges for actions:
    *   `Uploaded`: Green badge (`bg-emerald-50 text-emerald-700`).
    *   `Downloaded`: Blue badge (`bg-blue-50 text-blue-700`).
    *   `Deleted`: Red badge (`bg-rose-50 text-rose-700`).
