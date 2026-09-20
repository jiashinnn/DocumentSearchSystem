# OmniDoc - Backend Service

This is the Spring Boot backend for the OmniDoc document retrieval system. It provides the REST API for document uploading, hybrid searching (semantic + keyword), and activity logging.

## Prerequisites

Before running the backend, ensure you have the following installed:
1. **Java JDK 17** or higher
2. **PostgreSQL** database server (with `pgvector` support)
3. **Cloudflare R2** bucket (or any S3-compatible storage)
4. **Ollama** local AI model runner

---

## 1. Database Setup

1. Create a new PostgreSQL database:
   ```sql
   CREATE DATABASE omnidoc_db;
   ```
2. Connect to `omnidoc_db` and enable the required extensions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

---

## 2. Local AI Model Setup (Ollama)

Start Ollama in the background and pull the required 768-dimensional multilingual embedding model:
```bash
ollama pull paraphrase-multilingual
```
Make sure Ollama is running (`ollama serve`) before starting the backend.

---

## 3. Configuration

Open `src/main/resources/application-local.properties` (or copy it from `application.properties`) and configure your environment:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/omnidoc_db
spring.datasource.username=your_postgres_username
spring.datasource.password=your_postgres_password

# Cloudflare R2 / S3 Credentials
r2.endpoint-url=https://<your_account_id>.r2.cloudflarestorage.com
r2.access-key-id=<your_access_key_id>
r2.secret-access-key=<your_secret_access_key>
r2.bucket-name=your_bucket_name
```

---

## 4. Running the Application

You can run the application directly using the included Maven wrapper.

Navigate to the `backend` directory and run:
```bash
.\mvnw spring-boot:run
```

The server will start on port `8080`.

> **Tip:** If you are presenting the project, you can simply run the `start.bat` script located in the project root directory, which will automatically start both the backend and frontend servers for you.
