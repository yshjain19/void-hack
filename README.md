# CyberTrace — AI-Powered Forensic Investigation Platform

> A full-stack, production-grade forensic fraud investigation platform with graph-based relationship mapping, anomaly detection, immutable evidence chain-of-custody, LLM investigation reasoning, and professional PDF report generation.

## 🏗️ Architecture

```
Frontend (React + Vite + Tailwind + shadcn/ui)
    ↕ REST API
Backend (FastAPI + Python)
    ├── PostgreSQL (cases, evidence, custody logs, entities, reports)
    ├── Neo4j (entity relationship graph)
    ├── scikit-learn (Isolation Forest anomaly detection)
    ├── sentence-transformers (entity matching)
    └── LLM (mock/OpenAI/Ollama/Anthropic — swappable)
```

## 🚀 Quick Start (Docker Compose)

```bash
# 1. Copy environment config
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Access the platform
# Frontend: http://localhost:5173
# Backend API docs: http://localhost:8000/api/docs
# Neo4j Browser: http://localhost:7474
```

## 💻 Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Configuration

Edit `.env` to configure:
- **LLM_PROVIDER**: `mock` | `openai` | `ollama` | `anthropic`
- **LLM_API_KEY**: Your API key (for non-mock providers)
- **Database credentials** (PostgreSQL + Neo4j)

## 📋 Features

| Feature | Technology |
|---------|-----------|
| Evidence ingestion | Excel/CSV (openpyxl/Pandas), Email (.eml) |
| SHA-256 hashing | Automatic on upload |
| Chain of custody | Immutable linked-hash log (Postgres) |
| Entity extraction | Regex + column heuristics |
| Relationship graph | Neo4j + React Flow |
| Anomaly detection | Isolation Forest (scikit-learn) |
| Entity matching | sentence-transformers cosine similarity |
| AI investigation | Pluggable LLM (OpenAI/Ollama/mock) |
| PDF reports | ReportLab — cover page, tables, charts |
| JSON reports | Machine-readable forensic output |

## 📁 Project Structure

```
void hack/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── main.py                    # FastAPI entrypoint
│   ├── core/                      # Config, DB, Neo4j, hashing, custody
│   ├── models/                    # SQLAlchemy ORM models
│   ├── schemas/                   # Pydantic schemas
│   ├── routers/                   # API route handlers
│   └── services/
│       ├── ingestion/             # Excel, CSV, email parsers
│       ├── graph/                 # Neo4j graph builder & algorithms
│       ├── ml/                    # Anomaly detection, risk scorer, entity matcher
│       ├── llm/                   # Pluggable LLM client + prompts
│       └── reports/               # PDF + JSON report builders
└── frontend/
    └── src/
        ├── pages/                 # Dashboard, CaseList, GraphView, Analytics, AI, Reports
        ├── components/            # RiskBadge, EntityNode, CustodyChain, HashVerifier...
        └── lib/                   # API client, utilities
```

## 🔒 Forensic Integrity

Every evidence file is:
1. **SHA-256 hashed** immediately on upload
2. **Chain-of-custody logged** with chained hashes (tamper-evident)
3. **Verifiable** via the `/api/evidence/item/{id}/verify` endpoint
4. All reports are also hashed and stored with their SHA-256 digest

## 🧠 LLM Switching

Change `LLM_PROVIDER` in `.env`:
- `mock` — deterministic responses (default, no key needed)
- `openai` — requires `LLM_API_KEY` (GPT-4o)
- `ollama` — local Ollama server (`OLLAMA_BASE_URL`)
- `anthropic` — requires `LLM_API_KEY` (Claude)
