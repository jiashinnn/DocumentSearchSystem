# 📥 Document Download Module: Architecture & Watermarking Guide

This guide details the complete flow of the **Document Download and Watermarking Pipeline** in OmniDoc, covering database logging, Cloudflare R2 downloads, PDFBox watermarking, plain-text header banners, and streaming memory resources.

---

## 🏗️ Architectural Overview
The download process intercepts the file download request, performs verification directly against Cloudflare R2 bucket metadata, downloads the file stream, dynamically applies user-specific watermarks in-memory, logs the activity, and streams the modified bytes back to the browser:

$$\text{Click Download Icon} \rightarrow \text{headObject Check (200/404)} \rightarrow \text{Trigger Download URL} \rightarrow \text{Spring Controller} \rightarrow \text{R2 GetObject Stream} \rightarrow \text{Watermark Engine} \rightarrow \text{Audit Log Insert} \rightarrow \text{Stream Bytes} \rightarrow \text{Browser Save}$$

---

## 🏢 Summary of Module Components

| Layer | File in Project | Technical Duty |
| :--- | :--- | :--- |
| **1. Controller** | [DocumentController.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/controller/DocumentController.java) | Exposes file check and download endpoints. |
| **2. Service Layer** | [DocumentServiceImpl.java](file:///c:/Documents/Github/DocumentSearchSystem/backend/src/main/java/com/OmniDoc/backend/service/impl/DocumentServiceImpl.java) | Downloads bytes from R2, applies PDFBox visual grids or TXT banners, returns Resource. |
| **3. PDFBox Engine** | `addWatermarkToPdf` helper | Iterates PDF pages and draws 9 diagonal rotated watermarks at 12% opacity. |
| **4. Database Audit** | `records` table | Inserts a dynamic log showing the action was performed by the logged-in user. |
| **5. Frontend Handler** | [SearchView.tsx](file:///c:/Documents/Github/DocumentSearchSystem/frontend/src/components/SearchView.tsx) | Verifies existence, triggers temporary `<a>` element click to execute browser download. |

---

## 🔍 Detailed Component Analysis

### 1. Verification Checking Endpoint
Before downloading, the frontend must verify that the file actually exists in Cloudflare R2 storage. This prevents broken links or half-downloaded error pages.
*   **Controller mapping**: `GET /api/documents/download/{id}/check`
*   **Action**: Calls `s3Client.headObject()` to verify if the unique bucket key path exists in R2.
*   **Response**: Returns `200 OK` if the file exists, or `404 Not Found` if the key is missing or invalid.

---

### 2. PDF Watermarking using Apache PDFBox 3.x
For PDF files, we download the object as bytes, parse it in memory, and dynamically inject a **3x3 grid of 9 diagonal watermarks** on every page:

#### A. Document Loading
Instead of using disk-based files, we read the `byte[]` array directly in memory using the PDFBox 3.x **`Loader`** class:
```java
try (PDDocument document = Loader.loadPDF(pdfBytes))
```

#### B. Font and Styling
*   **Font**: PDFBox 3.x uses **`Standard14Fonts`** to import core document fonts:
    ```java
    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 22);
    ```
*   **Opacity (Semi-Transparency)**: We create an extended graphics state to set non-stroking opacity to **12%** (`0.12f`):
    ```java
    PDExtendedGraphicsState graphicsState = new PDExtendedGraphicsState();
    graphicsState.setNonStrokingAlphaConstant(0.12f);
    contentStream.setGraphicsStateParameters(graphicsState);
    ```
*   **Color**: Set color to a light grey using AWT Color:
    ```java
    contentStream.setNonStrokingColor(new java.awt.Color(150, 150, 150));
    ```

#### C. Grid Coordinate Trigonometry & Rotation
*   We render a grid at `15%`, `50%`, and `85%` of the page width and height.
*   To rotate each watermark 45 degrees diagonal, we compute the rotation sine and cosine parameters:
    $$\theta = 45^\circ \rightarrow \cos(45^\circ) \approx 0.7071, \quad \sin(45^\circ) \approx 0.7071$$
*   We apply this rotation matrix at each grid center $(x, y)$:
    ```java
    contentStream.setTextMatrix(new Matrix(cos, sin, -sin, cos, x, y));
    contentStream.showText(watermarkText);
    ```

---

### 3. Plain Text Watermarking (.txt)
Because raw text files do not support colors, rotation, or fonts, we watermark them by prepending a clean **Security Banner** directly to the top of the plain text before encoding it back to bytes:
```java
String originalText = new String(fileBytes, java.nio.charset.StandardCharsets.UTF_8);
String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
String watermarkBanner = String.format(
    "========================================================================\n" +
    "                        CONFIDENTIAL DOCUMENT\n" +
    "  Downloaded By: %s (%s)\n" +
    "  Download Date: %s\n" +
    "========================================================================\n\n",
    user.getName(), user.getEmail(), timestamp
);
String watermarkedText = watermarkBanner + originalText;
```

---

### 4. Streaming the Bytes
We stream the bytes back using memory resource wrappers:
*   **For Watermarked and Original documents**: We wrap the resulting byte array in a **`ByteArrayResource`**:
    ```java
    return new ByteArrayResource(fileBytes);
    ```

---

### 5. Frontend Trigger (`SearchView.tsx`)
1.  **Check API**: Calls the check endpoint. If not OK, prints a toast error and exits.
2.  **Anchor Simulation**: Creates a hidden HTML anchor `<a>` element, sets the href to `/api/documents/download/{id}?userEmail={email}`, clicks it programmatically, and removes it:
    ```typescript
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    ```
3.  **Naming Duplication**: When downloading, the browser receives the header `Content-Disposition: attachment; filename="..."` with the original display name from the database. The browser natively handles local file duplication (e.g. appending `(1)`).
