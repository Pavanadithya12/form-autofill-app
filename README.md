# Intelligent Form Auto-Filler — Full-Stack AI Web Application

> **Next.js 15 + TypeScript + Material UI + Framer Motion (Frontend) | FastAPI + EasyOCR + pdfplumber + python-docx + spaCy + MongoDB Atlas (Backend)**

An enterprise-grade, production-ready full-stack AI web application that parses unstructured documents (**PDF**, **DOCX**, **PNG**, **JPG**, **JPEG**), classifies document types, calculates OCR confidence scores per field, displays an AI executive summary, and populates interactive Material UI form fields with 100% data privacy.

---

## 🌟 Key Features

1. **Modern SaaS UI**: Glassmorphic Notion/Stripe/Vercel design aesthetic with Blue & White palette + Light/Dark mode toggle.
2. **Multi-Format Extraction**:
   - **PDF Parsing**: `pdfplumber` page-by-page text & table parser.
   - **DOCX Parsing**: `python-docx` Word document & tabular parser.
   - **Image OCR**: `EasyOCR` deep learning text extraction with PIL preprocessing.
3. **NLP Entity Extraction & Document Classification**:
   - Classifies document type (**Resume**, **Invoice**, **ID Card**, **Application Form**).
   - Extracts `Full Name`, `Email`, `Phone`, `Address`, `DOB`, `Education`, `Skills`, `Experience`, `Projects`, `Certifications`, `Languages`.
   - spaCy NER (`en_core_web_sm`) with robust Regex heuristics fallback.
   - AI Executive Document Summarizer.
4. **Interactive Split-Screen Preview & Confidence Highlighting**:
   - Left side: Uploaded Document Viewer (Zoom, Rotate, PDF iframe, Image view).
   - Right side: Auto-filled Material UI editable form with confidence chips (🟢 High >85%, 🟡 Review 60-85%, 🔴 Missing/Low <60%).
5. **Live AI Processing Timeline**: Framer Motion animated timeline tracking pipeline progress (`Upload` ➔ `EasyOCR` ➔ `spaCy NLP` ➔ `Mapping` ➔ `Completed`).
6. **MongoDB Atlas History**: Saves extraction history in MongoDB Atlas (with in-memory fallback).
7. **Export Capabilities**: 1-click download as structured **JSON** or formatted **ReportLab PDF Report**.
8. **DevOps & Containers**: Docker, Docker Compose, Vercel (`vercel.json`), Render (`render.yaml`).

---

## 🏗️ Project Architecture

```
form-autofiller-app/
├── backend/                    # FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── main.py             # App entry point, CORS, Lifespan
│   │   ├── config.py           # Environment & MongoDB Atlas settings
│   │   ├── database.py         # Motor async MongoDB driver + fallback
│   │   ├── models/schemas.py   # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── extract.py      # /api/extract - File upload & OCR/NLP pipeline
│   │   │   ├── history.py      # /api/history - Fetch MongoDB Atlas history
│   │   │   └── export.py       # /api/export/json & /api/export/pdf
│   │   └── services/
│   │       ├── ocr_service.py  # EasyOCR reader
│   │       ├── pdf_service.py  # pdfplumber PDF parser
│   │       ├── docx_service.py # python-docx parser
│   │       ├── nlp_service.py  # spaCy + RegEx NER & AI summarizer
│   │       └── pdf_generator.py # ReportLab PDF report builder
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # Next.js 15 (TypeScript + Material UI + Framer Motion)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root Layout & Theme registry
│   │   │   ├── providers.tsx   # MUI ThemeProvider & Dark/Light mode
│   │   │   └── page.tsx        # Main Application Dashboard
│   │   ├── components/
│   │   │   ├── Header.tsx      # Navbar & Theme toggle
│   │   │   ├── LandingHero.tsx # Hero section
│   │   │   ├── UploadZone.tsx  # Drag & Drop file uploader
│   │   │   ├── ProcessingTimeline.tsx # Framer Motion live AI timeline
│   │   │   ├── DocumentPreview.tsx   # Split view document preview
│   │   │   ├── AutoFillForm.tsx      # Material UI form with confidence chips
│   │   │   ├── AISummaryCard.tsx     # AI Summary & Document Classifier badge
│   │   │   ├── ExportActionBar.tsx   # JSON/PDF export buttons
│   │   │   └── HistoryDrawer.tsx     # MongoDB history drawer
│   │   ├── theme/muiTheme.ts
│   │   ├── types/extraction.ts
│   │   └── lib/api.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
│
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

## ⚡ Local Setup Guide

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### 1. Run Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm

uvicorn app.main:app --reload --port 8000
```
Backend API docs available at: `http://localhost:8000/api/docs`

---

### 2. Run Frontend (Next.js 15)
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App available at: `http://localhost:3000`

---

### 3. Run with Docker Compose (1-Click)
```bash
docker-compose up --build
```

---

## 🌐 Cloud Deployment Instructions

### Deploy Frontend to Vercel
1. Push project to **GitHub**.
2. Go to **[vercel.com](https://vercel.com)** → **Add New Project**.
3. Select the `frontend` folder as Root Directory.
4. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-render-backend.onrender.com`
5. Click **Deploy**.

---

### Deploy Backend to Render
1. Go to **[render.com](https://render.com)** → **New Web Service**.
2. Connect your GitHub repository.
3. Select `backend` folder as Root Directory.
4. Environment: `Python 3` or `Docker`.
5. Build Command:
   `pip install -r backend/requirements.txt && python -m spacy download en_core_web_sm`
6. Start Command:
   `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
7. Set Environment Variable (Optional):
   - `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster0.mongodb.net/form_autofill`
8. Click **Create Web Service**.
