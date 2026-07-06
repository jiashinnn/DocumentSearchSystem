# OmniDoc - Smart Document Search System (Frontend & Backend Integration Guide)

This repository contains the frontend implementation for **OmniDoc**, a smart concept-based document search system. The frontend is built as a highly interactive React application with standard, clean, and modular component structures. 

This document serves as a detailed technical specification of the frontend architecture, state management, and interaction flows to act as a blueprint for implementing the matching backend API.

---

## 🛠️ Frontend Technology Stack

*   **Framework**: React 19 (functional components using Hooks)
*   **Language**: TypeScript
*   **Build Tool & Dev Server**: Vite 8
*   **Styling**: Tailwind CSS v4 (configured edge-to-edge via `w-full px-6 sm:px-10`)
*   **Icons**: Lucide React (`lucide-react`)
*   **Notifications**: Sonner (`sonner` for toast notifications)

---

## 📁 Component Directory Structure

All components are stored under `src/components/` and are organized as follows:

```
src/
├── App.tsx                   # App root; orchestrates page views, global states (e.g. audit logs)
├── main.tsx                  # App entrypoint
├── index.css                 # Global CSS rules
├── assets/                   # Static assets (logos, images)
└── components/
    ├── Header.tsx            # Global header containing logo, centered tabs navigation, & Log Out action
    ├── Footer.tsx            # Corporate footer notice
    ├── LandingView.tsx       # Landing view showcasing features, containing the embedded LoginView
    ├── LoginView.tsx         # Embedded Login Form card with email, password inputs, & eye visibility toggles
    ├── SearchView.tsx        # Main search dashboard table, upload tools, individual actions, & bulk selections
    └── HistoryView.tsx       # Flat audit logs table supporting searching, action filters, & back-navigation
```

---

## 🔄 Core Layout & Interaction Specifications

### 1. View & Navigation States
The app switches between primary layout views based on local states managed in `App.tsx`:
*   `view`: `'landing' | 'search'`. 
    *   `landing`: Shows public system overview alongside the login card.
    *   `search`: Accesses the authorized user dashboard (requires login success).
*   `searchTab`: `'home' | 'history' | 'doc-logs'`.
    *   `home`: Renders `SearchView` document table.
    *   `history`: Renders global `HistoryView` tracking all system logs.
    *   `doc-logs`: Renders localized `HistoryView` showing logs for a single specific document.

### 2. Activity Audit Logging
Every user action in the document panel is immediately logged into the `historyLogs` state array inside `App.tsx`. 
A history log consists of the following structure:
```typescript
interface AuditLogItem {
  id: string;
  docName: string;
  action: 'Uploaded' | 'Downloaded' | 'Deleted';
  user: string;     // Defaults mock to 'current_user@company.com'
  date: string;     // Formatted YYYY-MM-DD HH:mm
}
```

---

## 🔌 Proposed Backend API Specification (V1 Blueprint)

To transition this frontend from mock state to live databases, the backend AI should construct a server implementing the following REST endpoints:

### 1. Authentication
*   **Endpoint**: `POST /api/auth/login`
*   **Request Body**:
    ```json
    {
      "email": "name@company.com",
      "password": "••••••••"
    }
    ```
*   **Response**: JWT session token or cookie.

### 2. Document Management
*   **Get Documents**: `GET /api/documents`
    *   *Parameters*: `search` (string, optional), `type` (string, optional).
    *   *Response*: Array of document items.
*   **Upload Document**: `POST /api/documents`
    *   *Type*: `multipart/form-data`
    *   *Payload*: File data object.
    *   *Response*: Uploaded document details.
*   **Download Single Document**: `GET /api/documents/:id/download`
    *   *Response*: File attachment stream.
*   **Delete Single Document**: `DELETE /api/documents/:id`
    *   *Response*: Success status (204 or 200).
*   **Bulk Download Documents**: `POST /api/documents/bulk-download`
    *   *Request Body*: ` { "ids": ["1", "2", "3"] } `
    *   *Response*: Zipped file package containing selected files.
*   **Bulk Delete Documents**: `POST /api/documents/bulk-delete`
    *   *Request Body*: ` { "ids": ["1", "2", "3"] } `
    *   *Response*: Success status.

### 3. Audit Activity Logging
*   **Get Global History Logs**: `GET /api/logs`
    *   *Parameters*: `search` (optional), `action` (optional).
    *   *Response*: Array of `AuditLogItem` elements.
*   **Get Specific Document Logs**: `GET /api/logs/document`
    *   *Parameters*: `docName` (string, required).
    *   *Response*: Array of `AuditLogItem` elements matching that document.
*   **Write Activity Log**: `POST /api/logs`
    *   *Request Body*:
        ```json
        {
          "docName": "report.pdf",
          "action": "Downloaded"
        }
        ```
    *   *Response*: Recorded audit log object.

---

## 🚀 Running the Frontend locally

The user is running the development server and bundling tasks manually.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
3. Build files for production:
   ```bash
   npm run build
   ```
