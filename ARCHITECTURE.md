# ApplianceIQ Architecture

This document describes the high-level architecture of the ApplianceIQ platform.

## System Overview

ApplianceIQ is a full-stack platform that transforms static appliance manuals into interactive AI assistants. It uses a modern tech stack consisting of FastAPI (Backend), React (Frontend), MongoDB (Database), and Pinecone (Vector Store).

## Component Architecture

### 1. Frontend (React)
- **Role**: Provides the user interface for administrators, business owners, and customers.
- **Key Features**: Role-based dashboards, manual upload interface, interactive chatbot.
- **State Management**: Uses React Hooks and Context API for authentication and notifications.

### 2. Backend (FastAPI)
- **Role**: Handles business logic, authentication, and communication between components.
- **Key Features**: JWT-based authentication, RAG (Retrieval-Augmented Generation) management, API for all frontend actions.
- **Worker Process**: Manages manual ingestion and PDF processing.

### 3. Database (MongoDB)
- **Role**: Primary data store for user profiles, manual metadata, and query history.
- **Integration**: Uses the Motor async driver for high performance.

### 4. Vector Store (Pinecone)
- **Role**: Stores document embeddings for fast semantic search.
- **Function**: Enables the RAG engine to find relevant manual sections based on user questions.

## Data Flow

1. **Manual Upload**: A business owner uploads a PDF. The backend extracts text, generates embeddings, and stores them in Pinecone.
2. **User Query**: A customer asks a question via the chatbot.
3. **Retrieval**: The RAG engine searches Pinecone for the most relevant sections of the manual.
4. **Generation**: The retrieved text is sent to an LLM (e.g., via Ollama) to generate a concise answer.
5. **Response**: The answer is returned to the user through the frontend interface.

## Security

- **Authentication**: JWT tokens stored in secure cookies.
- **Authorization**: Role-based access control (RBAC) enforced at the API level.
- **Data Isolation**: Multi-tenant design ensures business owners only access their own data.
