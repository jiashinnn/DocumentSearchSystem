# OmniDoc - Smart Document Search System

OmniDoc is a secure, high-performance web application designed for indexing and searching internal corporate documentation. This is an enterprise solution developed as an engineering internship project.

## Tech Stack
*   **Frontend:** React.js (Vite + TypeScript + Tailwind CSS v4 + shadcn/ui)
*   **Backend:** Spring Boot (Java 17 + Maven)
*   **Containerization:** Multi-stage Docker configurations



## Project Structure

```text
DocumentSearchSystem/
├── frontend/          # React single page application (UI)
│   ├── src/           # Frontend components, assets, and styling
│   └── tsconfig.json  # TypeScript configuration
├── backend/           # Spring Boot application (REST API)
│   ├── src/           # Spring controller, service, and security layers
│   ├── Dockerfile     # Multi-stage release Docker configuration
│   └── pom.xml        # Maven dependencies definition
└── README.md          # Project system documentation
```

## Getting Started
### 1. Run Frontend (React)
Navigate to the frontend directory, install dependencies, and start the Vite local development server:
```bash
cd frontend
npm install
npm run dev
```

> Accessible at: http://localhost:5173

### 2. Run Backend (Spring Boot)
Navigate to the backend directory and run the application using the Maven wrapper:

```bash
cd backend
./mvnw spring-boot:run
```
> Accessible at: http://localhost:8080