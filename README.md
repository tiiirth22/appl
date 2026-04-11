# ApplianceIQ: AI-Powered Smart Manual Management

<div align="center">
  <img src="assets/logo.png" alt="ApplianceIQ Logo" width="200"/>
  <h3>Interactive Manual Assistant leveraging Retrieval-Augmented Generation (RAG)</h3>
  <p>
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI"/>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
    <img src="https://img.shields.io/badge/Pinecone-27272E?style=for-the-badge&logo=pinecone&logoColor=white" alt="Pinecone"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  </p>
</div>

---

## Overview

ApplianceIQ is a full-stack web application that transforms static appliance manuals into interactive, AI-powered knowledge bases. Instead of reading through lengthy PDF manuals to find a specific instruction, users can simply ask a question in plain English and receive a precise, context-aware answer sourced directly from the relevant manual.

The system is built on the concept of Retrieval-Augmented Generation (RAG). When a user asks a question, the platform first retrieves the most relevant sections from the uploaded manual using vector similarity search (powered by Pinecone), and then passes those sections to a Large Language Model (Groq/Gemini) to generate a clear, accurate, and conversational response. This two-step approach ensures that answers are always grounded in the actual manual content, minimizing hallucination and maximizing reliability.

ApplianceIQ supports multiple user roles, including administrators, business owners, and end users, each with their own tailored dashboard and permissions. Business owners can upload product manuals, track usage analytics, and generate QR codes that link directly to an interactive chat interface for their appliances.

---

## Key Features

- **RAG-Powered Chat**: Ask questions about any uploaded manual in natural language. The system retrieves the most relevant passages and generates accurate, context-aware answers using a Large Language Model.
- **Smart Document Processing**: Automatic text extraction from PDFs and images (JPG, PNG) using OCR. Extracted content is chunked, embedded into vectors, and stored for fast retrieval.
- **Multi-Tenant Role-Based Dashboards**:
  - **Admin Dashboard**: Full system oversight including user management, manual management across all business owners, and platform-wide analytics.
  - **Business Owner Dashboard**: Upload and manage manuals, view per-manual usage statistics, generate and download QR codes, and monitor customer interaction analytics.
- **QR Code Integration**: Each uploaded manual automatically gets a unique QR code. Customers can scan the QR sticker on their physical appliance to instantly open the interactive chat assistant for that specific product, without needing to log in.
- **Conversation History**: Chat sessions are persisted in the database. When a user returns, the system automatically injects previous conversation context for continuity.
- **Rate Limiting**: Built-in rate limiter to prevent abuse of the chat and query endpoints.
- **Cloud-Native Storage**: All manual files and QR code images are stored on Cloudinary, ensuring reliable access and delivery.

---

## Technology Stack

| Layer             | Technology                          | Purpose                                      |
|-------------------|-------------------------------------|----------------------------------------------|
| Frontend          | React, Tailwind CSS                 | User interface and role-based dashboards      |
| Backend API       | FastAPI (Python)                    | REST API, authentication, orchestration      |
| Chat Service      | FastAPI (Python)                    | RAG engine, vector search, LLM integration   |
| Ingestion Service | FastAPI (Python)                    | PDF/image processing, text extraction, embedding |
| Database          | MongoDB (Motor async driver)        | User profiles, manual metadata, chat history |
| Vector Store      | Pinecone                            | Semantic search over document embeddings     |
| File Storage      | Cloudinary                          | Manual PDFs, images, and QR code hosting     |
| LLM Provider      | Groq (Llama-3) / Google Gemini      | Natural language answer generation           |
| Authentication    | Session-based (bcrypt + secure tokens) | User login, signup, and role enforcement   |

---

## Architecture

ApplianceIQ follows a microservices-inspired architecture with three independently deployable services:

```
                    +---------------------+
                    |     React Frontend  |
                    |  (Tailwind CSS UI)  |
                    +----------+----------+
                               |
                               | HTTP REST
                               v
                    +----------+----------+
                    |   Backend API       |
                    |   (FastAPI :8000)   |
                    |                     |
                    |  - Authentication   |
                    |  - Manual CRUD      |
                    |  - QR Code Gen      |
                    |  - Chat Proxy       |
                    |  - Rate Limiting    |
                    +----+----------+-----+
                         |          |
              +----------+          +----------+
              v                                v
   +----------+----------+         +-----------+-----------+
   |  Chat Service        |         |  Ingestion Service    |
   |  (FastAPI :8001)     |         |  (FastAPI :8002)      |
   |                      |         |                       |
   |  - RAG Engine        |         |  - PDF Text Extraction|
   |  - Vector Search     |         |  - OCR Processing     |
   |  - LLM Generation    |         |  - Text Chunking      |
   |  - Image Analysis    |         |  - Vector Embedding   |
   +----+----------+------+         +----+----------+-------+
        |          |                      |          |
        v          v                      v          v
   +----+---+  +---+------+         +----+---+  +---+------+
   |Pinecone|  |Groq/Gemini|        |Pinecone|  |Cloudinary|
   |        |  |(LLM API)  |        |        |  |          |
   +--------+  +-----------+        +--------+  +----------+
                    
                    +--------+
                    |MongoDB |
                    |(Atlas) |
                    +--------+
```

---

## Application Workflow

The following sections describe how the major use cases flow through the system end to end.

### 1. User Registration and Authentication

1. A new user navigates to the Signup page and submits their name, email, password, and role (Admin or Business Owner).
2. The frontend sends a POST request to `/api/auth/signup`.
3. The backend hashes the password using bcrypt, creates a user document in MongoDB, and generates a unique session token.
4. The session token is returned to the frontend, which stores it and uses it in the Authorization header for all subsequent requests.
5. On future visits, the frontend calls `/api/auth/me` with the stored token to verify the session and retrieve user details.
6. Role-based access control (RBAC) is enforced at the API layer. Admin-only and business-owner-only endpoints reject unauthorized users with a 403 error.

### 2. Manual Upload and Processing

1. A business owner navigates to the Manual Upload page and selects a PDF or image file, along with metadata (appliance model name, version, region).
2. The frontend sends a multipart POST request to `/api/manuals/upload`.
3. The backend reads the file content and uploads it to Cloudinary, obtaining a public URL.
4. A manual record is created in MongoDB with status set to "processing".
5. The backend forwards the file URL and metadata to the Ingestion Service (`/ingest` endpoint).
6. The Ingestion Service downloads the file from Cloudinary, extracts text (using PDF parsing or OCR for images), splits the text into chunks, generates vector embeddings for each chunk, and upserts them into the Pinecone vector index.
7. Once processing completes, the manual status is updated to "ready".
8. A QR code is automatically generated for the manual, linking to the chat interface with the manual ID embedded. The QR code image is uploaded to Cloudinary and the record is stored in MongoDB.

### 3. Customer Query (RAG Chat)

1. A customer accesses the chat interface, either by logging in and selecting a manual, or by scanning a QR code on their physical appliance.
2. The customer types a question (e.g., "How do I clean the filter?").
3. The frontend sends a POST request to `/api/chat` with the manual ID and question.
4. The backend retrieves the manual record from MongoDB to get the model name, then fetches conversation history from the database (last 3 exchanges) for context continuity.
5. The backend forwards the query, history, and manual metadata to the Chat Service (`/query` endpoint).
6. The Chat Service generates a vector embedding of the question, searches Pinecone for the top-k most similar document chunks from that specific manual, and constructs a prompt combining the retrieved context with the user's question.
7. The prompt is sent to the LLM provider (Groq Llama-3 or Google Gemini), which generates a natural language answer.
8. The answer, along with source references and a confidence score, is returned to the backend.
9. The backend logs the query and response in MongoDB for analytics and future context, then streams the response back to the frontend.
10. The frontend displays the answer with source citations and confidence indicators.

### 4. QR Code Scanning (Guest Access)

1. A customer scans the QR code sticker on their physical appliance using their phone camera.
2. The QR code URL directs them to the ApplianceIQ chat interface with the manual ID pre-loaded.
3. No login is required. The backend allows unauthenticated access to the chat endpoint when a valid manual ID is provided.
4. The customer can immediately start asking questions about their appliance.

### 5. Admin and Analytics Workflow

1. An admin logs in and is directed to the Admin Dashboard.
2. The dashboard displays platform-wide statistics: total users, total manuals, total queries, and active sessions.
3. The admin can view and manage all users, assign QR codes to specific manuals, and delete manuals or users.
4. Business owners see their own dashboard with per-manual analytics: number of queries, average confidence scores, and upload history.
5. The Analytics page provides visual charts and breakdowns of usage patterns over time.

---

## Project Structure

```text
applianceiq/
|-- backend/                   # Backend API Gateway (FastAPI)
|   |-- server.py              # Main API entry point with all route definitions
|   |-- auth.py                # Authentication logic (signup, login, session management)
|   |-- models.py              # Pydantic models and database schemas
|   |-- ml_client.py           # HTTP client for communicating with ML services
|   |-- qr_handler.py          # QR code generation and management
|   |-- .env                   # Environment variables (MongoDB, Cloudinary, API keys)
|   +-- requirements.txt       # Python dependencies for the backend
|
|-- chat_service/              # Chat and RAG Service (FastAPI)
|   |-- server.py              # Chat service API endpoints
|   |-- rag_engine.py          # Core RAG logic (retrieval, prompt construction, LLM calls)
|   |-- config.py              # Service configuration and environment loading
|   |-- model_manager.py       # LLM model initialization and management
|   |-- errors.py              # Custom error types and error handling
|   |-- logger_config.py       # Structured logging configuration
|   +-- requirements.txt       # Python dependencies for the chat service
|
|-- ingestion_service/         # Document Ingestion Service (FastAPI)
|   |-- server.py              # Ingestion service API endpoints
|   |-- processor.py           # PDF/image text extraction, chunking, and embedding
|   |-- config.py              # Service configuration
|   |-- model_manager.py       # Embedding model management
|   |-- errors.py              # Custom error types
|   |-- logger_config.py       # Logging configuration
|   +-- requirements.txt       # Python dependencies for the ingestion service
|
|-- frontend/                  # React Frontend Application
|   |-- public/                # Static assets and index.html
|   +-- src/
|       |-- pages/
|       |   |-- Landing.js             # Public landing page
|       |   |-- Login.js               # Login page
|       |   |-- Signup.js              # Registration page
|       |   |-- AdminDashboard.js      # Admin management dashboard
|       |   |-- BusinessOwnerDashboard.js  # Business owner dashboard
|       |   |-- ManualUpload.js        # Manual upload interface
|       |   |-- ChatBot.js            # Interactive chat interface
|       |   |-- Analytics.js           # Usage analytics and charts
|       |   +-- Dashboard.js           # General dashboard view
|       |-- components/
|       |   |-- ui/
|       |   |   |-- Navbar.jsx         # Navigation bar
|       |   |   +-- stat-card.jsx      # Statistics display card
|       |   +-- LiveCameraOverlay.js   # Live camera analysis overlay
|       |-- App.css                    # Application-level styles
|       |-- index.css                  # Global styles and design tokens
|       +-- tailwind.config.js         # Tailwind CSS configuration
|
|-- assets/                    # Logo and branding assets
|-- docs/                      # Additional documentation
|-- tests/                     # Test suite
|-- ARCHITECTURE.md            # High-level architecture documentation
|-- API_REFERENCE.md           # API endpoint reference
|-- QUICKSTART.md              # Quick start guide
|-- CONTRIBUTING.md            # Contribution guidelines
|-- SECURITY.md                # Security policy
|-- ROADMAP.md                 # Project roadmap
|-- requirements.txt           # Root-level Python dependencies
+-- run_all.bat                # Script to start all services
```

---

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- MongoDB Atlas account (or local MongoDB instance)
- Cloudinary account (for file and QR code storage)
- Pinecone account (for vector storage)
- Groq API key (for Llama-3 inference) or Google Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tiirth22/Appliance_IQ.git
   cd Appliance_IQ
   ```

2. Set up the Backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
   Create a `.env` file in the `backend/` directory:
   ```env
   MONGO_URL=your_mongodb_atlas_connection_string
   DB_NAME=applianceiq_db
   PINECONE_API_KEY=your_pinecone_api_key
   GROQ_API_KEY=your_groq_api_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ML_SERVICE_URL=http://localhost:8001
   INGESTION_SERVICE_URL=http://localhost:8002
   ```

3. Set up the Chat Service:
   ```bash
   cd chat_service
   pip install -r requirements.txt
   ```

4. Set up the Ingestion Service:
   ```bash
   cd ingestion_service
   pip install -r requirements.txt
   ```

5. Set up the Frontend:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

Start each service in a separate terminal:

- Backend API (Port 8000):
  ```bash
  cd backend
  python server.py
  ```

- Chat Service (Port 8001):
  ```bash
  cd chat_service
  python server.py
  ```

- Ingestion Service (Port 8002):
  ```bash
  cd ingestion_service
  python server.py
  ```

- Frontend (Port 3000):
  ```bash
  cd frontend
  npm start
  ```

Alternatively, use the provided batch script to start all services at once:
```bash
run_all.bat
```

---

## Contributing

Contributions are welcome. Please fork the repository and open a Pull Request for any enhancements or bug fixes. See CONTRIBUTING.md for detailed guidelines.

---

## License

Distributed under the MIT License. See LICENSE for more information.

---

<p align="center">Made for a smarter home experience.</p>
