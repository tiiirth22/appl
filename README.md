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

## 🚀 Overview

**ApplianceIQ** transforms static appliance manuals into interactive, searchable knowledge bases. By leveraging **Retrieval-Augmented Generation (RAG)**, it enables users to ask natural language questions and receive accurate answers directly from their appliance's documentation. No more scrolling through 100-page PDFs—just get the answers you need, instantly.

---

## ✨ Key Features

- **RAG-Powered Chat**: Query manuals in natural language with high accuracy.
- **Smart Document Processing**: Automatic text extraction from PDFs and images using OCR.
- **Multi-Tenant Dashboards**:
  - **Admin**: Comprehensive user and system management.
  - **Business Owner**: Manual lifecycle management and usage analytics.
- **QR Code Integration**: Scan a sticker on your appliance to jump directly into its interactive manual.
- **High-Performance Architecture**: Lazy model loading and asynchronous processing for a smooth experience.

---

## 🛠️ Architecture

ApplianceIQ follows a modern microservices-inspired architecture:

- **Frontend**: A responsive React interface styled with Tailwind CSS.
- **API Gateway (Backend)**: FastAPI server handling authentication, state management, and orchestration.
- **ML Microservice**: Dedicated service for heavy lifting—PDF processing, text embedding, and vector search management.
- **Data Layers**:
  - **MongoDB**: Persistent storage for users, manual metadata, and chat history.
  - **Pinecone**: High-speed vector database for contextual retrieval.
  - **Cloudinary**: Secure storage for manual files and generated QR codes.

---

## 🚦 Getting Started

### Prerequisites

- **Python 3.9+** & **Node.js 16+**
- **Cloudinary Account** (for file/QR storage)
- **Pinecone Account** (for vector storage)
- **Groq API Key** (for Llama-3 inference)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tiirth22/Appliance_IQ.git
   cd Appliance_IQ
   ```

2. **Backend Configuration**:
   Create a `.env` file in the `backend/` directory:
   ```env
   MONGO_URL=your_mongodb_url
   PINECONE_API_KEY=your_pinecone_key
   GROQ_API_KEY=your_groq_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Start the Services**:
   - **Backend**: `cd backend && python server.py` (Default: Port 8000)
   - **ML Service**: `cd ml_service && python server.py` (Default: Port 8001)
   - **Frontend**: `cd frontend && npm start` (Default: Port 3000)

---

## 📂 Project Structure

```text
├── backend/               # FastAPI Orchestration Layer
│   ├── auth.py            # Authentication & RBAC
│   ├── ml_client.py       # ML Service Integration
│   ├── models.py          # Database Schemas
│   └── server.py          # Main API Entry Point
├── ml_service/            # Heavy ML Processing Layer
│   ├── processor.py       # Document Extraction & Embedding
│   ├── rag_engine.py      # Vector Retrieval & LLM Logic
│   └── server.py          # ML API Endpoints
├── frontend/              # React/Tailwind Frontend
│   └── src/               # UI Components & State Logic
└── assets/                # Visual Branding & Documentation
```

---

## 🤝 Contributing

We welcome contributions! Please fork the repository and open a Pull Request for any enhancements or bug fixes.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Made for a smarter home experience.</p>
