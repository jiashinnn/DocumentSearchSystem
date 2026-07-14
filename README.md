# 📂 OmniDoc - Smart Document Search System

OmniDoc is a secure, high-performance web application designed for indexing, searching, and managing internal corporate documentation. It utilizes a state-of-the-art **Retrieval-Augmented Generation (RAG)** pipeline to perform hybrid semantic and keyword text search on document content.

---

## 🛠️ Tech Stack

### Frontend
*   **Core**: React.js (Vite + TypeScript)
*   **Styling**: Tailwind CSS v4 + shadcn/ui
*   **Icons**: Lucide React

### Backend
*   **Core**: Spring Boot (Java 17 + Maven)
*   **Semantic Intelligence**: LangChain4j + Local In-Process ONNX Embedding Model (`all-minilm-l6-v2`)
*   **Text Extraction**: Apache Tika 3.0.0
*   **Watermarking**: Apache PDFBox 3.0.7

### Database & Cloud Storage
*   **Database**: PostgreSQL
*   **Extensions**: `pgvector` (semantic search) and `pg_trgm` (trigram fuzzy keyword search)
*   **Cloud Storage**: Cloudflare R2 (S3-compatible Object Storage)

---

## 📁 Project Structure

```text
DocumentSearchSystem/
├── frontend/          # React single page application (UI)
│   ├── src/           # Frontend components, assets, and styling
│   ├── .env           # Frontend environment variables (API URL)
│   └── tsconfig.json  # TypeScript configuration
├── backend/           # Spring Boot application (REST API)
│   ├── src/           # Controller, Service, Repository, Entity, and DTO layers
│   ├── pom.xml        # Maven dependencies definition
│   └── *.md           # Architectural module guides (Upload, Download, Search, etc.)
└── README.md          # Project system documentation
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your machine:
1.  **Java JDK 17** or higher
2.  **Node.js 18** or higher
3.  **PostgreSQL** database server
4.  **Cloudflare R2** bucket and API credentials

---

### 1. Database Setup

1.  Create a new PostgreSQL database:
    ```sql
    CREATE DATABASE omnidoc_db;
    ```
2.  Connect to `omnidoc_db` and enable the vector and trigram extensions:
    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    ```

---

### 2. Configure Backend Environment

Open `backend/src/main/resources/application-local.properties` (or copy it from `application.properties`) and fill in your details:

```properties
# Database details
spring.datasource.url=jdbc:postgresql://localhost:5432/omnidoc_db
spring.datasource.username=your_postgres_username
spring.datasource.password=your_postgres_password

# Cloudflare R2 Credentials
r2.endpoint-url=https://<your_account_id>.r2.cloudflarestorage.com
r2.access-key-id=<your_access_key_id>
r2.secret-access-key=<your_secret_access_key>
r2.bucket-name=your_bucket_name
```

---

### 3. Run Backend (Spring Boot)

Navigate to the `backend` directory and compile/run the application:

```bash
cd backend
mvn clean spring-boot:run
```
> The API will be accessible at: `http://localhost:8080`

---

### 4. Configure & Run Frontend (React)

1.  Open `frontend/.env` and verify the backend API base URL matches:
    ```env
    VITE_API_BASE_URL=http://localhost:8080
    ```
2.  Install dependencies and start the Vite local development server:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
> The portal will be accessible at: `http://localhost:5173`