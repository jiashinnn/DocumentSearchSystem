# 🏗️ Spring Boot Backend Package & Layer Architecture Guide

This guide explains the architectural layer design of the OmniDoc backend, detailing the responsibility of each package under `com.OmniDoc.backend`.

---

## 🏢 Summary of the Layer Flow
In a standard enterprise Spring Boot design, data travels through layers in a structured path. Each layer has **one specific job**, ensuring separation of concerns:

$$\text{HTTP Request} \rightarrow \text{Controller} \rightarrow \text{DTO} \rightarrow \text{Service Layer} \rightarrow \text{Mapper} \rightarrow \text{Repository} \rightarrow \text{Entity} \rightarrow \text{Database}$$

---

## 📦 Package Directory Structure

```text
com.OmniDoc.backend/
├── config/        # System & Bean configurations (Security, CORS, R2, Seeding)
├── controller/    # HTTP Rest Controllers (API gatekeepers/endpoints)
├── dto/           # Data Transfer Objects (Frontend payload structures)
├── entity/        # JPA Entities (Direct database table structures)
├── mapper/        # Translators (Converts Entities to DTOs & vice-versa)
├── repository/    # Database Access Layer (SQL queries & JpaRepository helpers)
└── service/       # Business Logic Layer (The core brain of the system)
    └── impl/      # Concrete Service Implementations (LangChain4j, Tika, PDFBox)
```

---

## 🔍 Detailed Package Descriptions

### 1. 🗃️ `entity` (Database Blueprints)
*   **Analogy**: The architectural blueprint of a physical database table.
*   **Role**: Map standard Java classes to PostgreSQL database tables using JPA annotations (like `@Entity` and `@Table`).
*   **Why we need it**: Java cannot interact with SQL columns directly. Entities define what tables and columns exist in PostgreSQL.
*   *Example files*: `User.java` (maps to `users` table), `File.java` (maps to `files` table).

---

### 2. 📇 `repository` (Database Access Clerks)
*   **Analogy**: The database clerk who directly searches, inserts, and retrieves records.
*   **Role**: Interface layer that extends `JpaRepository`. It acts as the bridge between your Spring code and PostgreSQL.
*   **Why we need it**: Writing manual SQL queries for everything is slow and error-prone. Spring Boot auto-generates query logic for methods like `findById()` or `save()`. It is also where custom native queries (like pgvector cosine searches) are declared.
*   *Example files*: `UserRepository.java`, `ChunkRepository.java`.

---

### 📦 3. `dto` (Data Transfer Objects)
*   **Analogy**: A custom paper form filled by a customer, showing only what they need.
*   **Role**: Simple Java classes that carry data between the client (frontend) and the server (backend controller).
*   **Why we need it**: **Security and Efficiency**. You should never expose your raw database Entity structure to the frontend. For example, a `User` entity contains a hashed password, which should never be sent to the browser. A `LoginResponse` DTO only carries the safe public fields (like `email`, `name`).
*   *Example files*: `LoginRequest.java`, `FileDto.java`, `SearchResultDto.java`.

---

### 🔄 4. `mapper` (The Translators)
*   **Analogy**: The translator who converts a custom paper form (DTO) into official database records (Entity), and vice-versa.
*   **Role**: Standard Java utility classes containing mapping functions.
*   **Why we need it**: Decouples the service layers. It takes a raw database Entity result (e.g. `File` with path keys) and transforms it into a clean, format-friendly DTO (e.g. `FileDto` with formatted KB/MB size strings) to return as JSON.
*   *Example files*: `UserMapper.java`, `FileMapper.java`.

---

### 🧠 5. `service` & `service.impl` (The Brain / Business Rules)
*   **Analogy**: The operations supervisor who verifies business rules, handles security, and runs logic pipelines.
*   **Role**: Where the core business logic runs (e.g. validating files, calling Apache Tika to parse PDFs, chunking paragraphs, generating pgvector embeddings, and applying PDFBox watermarks).
*   **Why we need it**: Controllers should only route incoming web traffic, and Repositories should only read/write database columns. The Service layer is the only place where logical computations are allowed.
*   *Example files*: `DocumentService.java` (interface contract), `DocumentServiceImpl.java` (concrete implementation).

---

### 🚪 6. `controller` (The Gatekeeper / Front Desk Counter)
*   **Analogy**: The front-desk receptionist who greets guests (HTTP Requests) and directs them to the correct office.
*   **Role**: REST API Controllers annotated with `@RestController` that listen for incoming HTTP endpoints (like `POST /api/documents/upload`).
*   **Why we need it**: It intercepts requests coming from Vite/React, parses JSON inputs, calls the correct service methods, handles response HTTP statuses (like `200 OK`, `400 Bad Request`, `500 Server Error`), and controls CORS origins.
*   *Example files*: `AuthController.java`, `DocumentController.java`.

---

### ⚙️ 7. `config` (System Setup & Beans)
*   **Analogy**: The wiring and machinery running in the background.
*   **Role**: Configuration classes annotated with `@Configuration`.
*   **Why we need it**: Instantiates external classes as reusable Spring Beans (like setting up the Cloudflare R2 `S3Client` connection or configuring BCrypt `PasswordEncoder`). It also seeds initial test data into the database when the application starts.
*   *Example files*: `R2Config.java`, `AppConfig.java`, `DataInitializer.java`.
