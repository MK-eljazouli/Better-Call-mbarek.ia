<div align="center">
  <h1>⚖️ المستشار القانوني — Chatbot Juridique Marocain</h1>
  <p><i>A comprehensive RAG-based legal assistant specialized in Moroccan law, deployed on Azure.</i></p>
</div>

<hr />

## 📖 Overview

The **Moroccan Legal Advisor** is an advanced AI-powered chatbot designed to provide precise, context-aware answers to legal questions based exclusively on official Moroccan legal texts. Built on a robust Azure infrastructure using a **Retrieval-Augmented Generation (RAG)** approach, it ensures high reliability and zero hallucination.

## 🏗 Architecture & Stack

- **Backend**: Python, FastAPI
  - **LLM**: Azure OpenAI (`gpt-4o-mini`) for intelligent generation.
  - **Embeddings**: `text-embedding-3-small` for semantic search.
  - **Vector Store**: Azure SQL Database utilizing the native `VECTOR` type for efficient retrieval.
- **Frontend**: React, Vite, Tailwind CSS
- **Data Source**: Comprehensive JSON collections of Moroccan legal texts (e.g., Penal Code, Family Code, Constitution).

## 🛡️ RAG Pipeline Rules

To maintain the highest standard of legal accuracy, the system enforces strict rules:

1. **Zero Hallucination**: The bot answers *only* using the provided JSON texts.
2. **Citations**: Every answer explicitly cites the specific Article (الفصل/المادة) and the Law (القانون).
3. **Rejection Policy**: It politely refuses to answer parameters or questions outside the scope of Moroccan law.

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### 1. Prerequisites

Ensure you have the following installed and configured before proceeding:
- **Python** 3.10+
- **Node.js** 18+
- **ODBC Driver 18** for SQL Server
- An **Azure Subscription** with active instances for OpenAI and SQL Database

### 2. Configuration

Create a `.env` file inside the `backend` directory based on the provided `backend/.env.example`:

```ini
AZURE_OPENAI_ENDPOINT="your_endpoint_here"
AZURE_OPENAI_API_KEY="your_api_key_here"
AZURE_SQL_CONNECTION_STRING="your_connection_string_here"
```

### 3. Installation

Run the following commands to install dependencies for both the backend and frontend:

**Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend Setup:**
```bash
cd frontend
npm install
```

### 4. Data Ingestion

Populate your Azure SQL Database with embeddings. **Note:** This only needs to be run once.

```bash
cd backend
python ingest.py
```

### 5. Running the Application

You can start the full stack via the provided batch script:
```bash
start.bat
```

Alternatively, you can run the sub-systems manually depending on your workflow:
- **Backend**: `uvicorn main:app --reload` (Runs on Port `8000`)
- **Frontend**: `npm run dev` (Runs on Port `3000`)

---

## � Project Structure

A detailed overview of the core directories and key files:

```text
DALIL/
├── Data/                       # Raw JSON legal texts (Constitution, Penal Code, etc.)
│
├── backend/                    # Core Python/FastAPI Backend
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Environment and configuration loading
│   ├── data_loader.py          # Utilities for reading JSON data
│   ├── embedding_service.py    # Azure OpenAI embeddings generator
│   ├── ingest.py               # Script to ingest data into vector store
│   ├── rag_service.py          # RAG pipeline and conversational logic
│   ├── vector_store.py         # Azure SQL vector database operations
│   ├── build_local_db.py       # Helper to build a local version of the DB
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React Frontend Application
│   ├── index.html              # HTML entry point
│   ├── index.tsx               # React application mounting point
│   ├── App.tsx                 # Main UI application layout
│   ├── components/             # Reusable React components (Chat UI, etc.)
│   ├── services/               # Frontend API connection utilities
│   ├── vite.config.ts          # Vite build configuration
│   └── package.json            # Node.js dependencies and scripts
│
├── start.bat                   # Automation script to run the full stack
├── RAPPORT_PROJET.tex          # Project Report (LaTeX)
└── RAPPORT_TECHNIQUE_FINAL.md  # Detailed Technical Report
```

<hr />
<div align="center">
  <p>Developed with ❤️ to simplify access to Moroccan Law.</p>
</div>
