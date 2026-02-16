# ApplianceIQ: AI-Powered Smart Manual Management

<div align="center">
  <img src="assets/logo.png" alt="ApplianceIQ Logo" width="200"/>
  <h3>Interactive Manual Assistant</h3>
  <p>
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI"/>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License"/>
  </p>
</div>

---

## Quick Links
- [Getting Started](#getting-started)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## Overview

**ApplianceIQ** provides a searchable interface for appliance manuals using Retrieval-Augmented Generation (RAG). It processes uploaded PDF manuals to allow users to query specific appliance models using natural language.

Users can retrieve maintenance and operation details directly through a chat interface without navigating the original PDF document.

![ApplianceIQ Dashboard](assets/dashboard.png)

---

## Key Features

- **Role-Based Access Control**: Separate authentication and dashboards for **Administrators** and **Business Owners**.
- **Dynamic Dashboards**:
  - **Admin**: System-wide user and manual management.
  - **Business Owner**: Specific manual management and usage tracking.
- **AI-Powered Chatbot**: Technical queries answered using indexed manual content.
- **Manual Processing**: Automatic text extraction and vector embedding for uploaded PDFs.
- **QR Code Integration**: Unique QR codes link directly to interactive manuals.
- **Service Resilience**: Core features remain operational if ML services are unavailable.

---

## Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [MongoDB](https://www.mongodb.com/) (Motor Async Driver)
- **Vector Search**: [Qdrant](https://qdrant.tech/) (for high-performance RAG)
- **AI/ML**: Transformers, Embeddings, and NLP models.
- **Security**: JWT Authentication & Bcrypt password hashing.

### Frontend
- **Library**: [React.js](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide Icons](https://lucide.dev/)
- **State Management**: React Hooks & Context API.

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB instance (local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/tiirth22/Appliance_IQ.git
cd Appliance_IQ
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
# Create a .env file based on the provided configuration
python server.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## Project Structure

```text
.
├── backend/               # FastAPI Server logic
│   ├── auth.py            # JWT & Authentication
│   ├── models.py          # Pydantic & DB Models
│   ├── ingestion.py       # Document processing (optional)
│   ├── rag.py             # RAG Engine (Vector search)
│   ├── qr_handler.py      # QR code generation
│   └── server.py          # API Entry point
├── frontend/              # React Application
│   ├── src/pages/         # Dashboard & Auth views
│   ├── src/components/    # Reusable UI components
│   ├── src/hooks/         # Custom React hooks
│   └── src/lib/           # Utility functions
├── assets/                # README images & logos
├── tests/                 # API & Unit tests
└── docs/                  # Detailed documentation (deprecated)
```

---

## Implementation Status

### Backend (100%)
- [x] FastAPI server structure
- [x] MongoDB & Qdrant integration
- [x] Environment configuration
- [x] CORS & Middleware setup

### Authentication & Authorization (100%)
- [x] First-party signup/login
- [x] JWT Session tokens
- [x] Role-based access control (Admin/Business Owner)

### Frontend (100%)
- [x] Responsive Dashboards (Admin/Business Owner)
- [x] Interactive Chat Interface (RAG-ready)
- [x] Manual Upload & Management
- [x] Secure Auth Flow integration

### API Documentation

The backend provides a comprehensive API with Swagger documentation. Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Contributing

We welcome contributions! Please follow these steps:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## Key Contacts

- **Maintainer**: Tiirth Patel (tiirth22)
- **Email**: support@applianceiq.ai
- **Project Link**: [https://github.com/tiirth22/Appliance_IQ](https://github.com/tiirth22/Appliance_IQ)

---

## Maintenance

To keep the platform running smoothly:
- Regularly update dependencies in both `backend` and `frontend`.
- Monitor MongoDB and Qdrant performance.
- Clear temporary files in the `backend/tmp` directory periodically.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Made for a smarter home experience.</p>
