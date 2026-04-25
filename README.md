<<<<<<< HEAD
# resume-screening-system
=======
# HireIQ — AI-Powered Resume Screening System

A production-grade, full-stack resume screening application powered by **Claude AI (Anthropic)**. Screen, rank, and shortlist candidates at scale with detailed AI analysis, score breakdowns, and interview question suggestions.

---

## ✨ Features

### Core
- 🤖 **AI Resume Screening** — Claude analyzes resumes against job requirements and produces structured assessments
- 📊 **Score Breakdown** — Skills Match, Experience, Education, and Culture Fit (weighted overall score)
- 🗂️ **Job Management** — Create, edit, and manage job listings with requirements
- 📁 **Bulk Upload** — Drag-and-drop up to 10 resumes at once (PDF, DOCX, TXT)
- ⚡ **Batch Screening** — Screen all pending resumes for a job in one click
- 📈 **Analytics Dashboard** — Pipeline insights, score distributions, and activity tracking
- 👥 **Candidate Profiles** — AI-extracted contact info, skills, and experience
- 💬 **Interview Questions** — Tailored questions generated per candidate
- 🔐 **Auth System** — JWT-based login with role-based access (Admin / Recruiter)

### Technical
- Rate limiting on all API endpoints + stricter limits for AI calls
- File validation (type, size, content quality)
- In-memory data store (swap for PostgreSQL/MongoDB for production)
- Structured logging with Winston
- Docker + Docker Compose for deployment
- Fully typed TypeScript frontend

---

## 🏗️ Architecture

```
resume-screening-system/
├── backend/                     # Express.js API server
│   ├── server.js                # Entry point, middleware setup
│   ├── routes/
│   │   ├── auth.js              # Login, register, JWT
│   │   ├── jobs.js              # Job CRUD
│   │   ├── resumes.js           # Resume upload & management
│   │   ├── screening.js         # AI screening endpoints
│   │   └── analytics.js         # Analytics & reporting
│   ├── services/
│   │   ├── aiScreening.js       # Claude AI integration (core)
│   │   └── resumeParser.js      # PDF/DOCX/TXT text extraction
│   ├── models/
│   │   └── store.js             # In-memory data store (DB layer)
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── upload.js            # Multer file upload config
│   │   └── errorHandler.js      # Global error handling
│   └── utils/
│       └── logger.js            # Winston logging
│
├── frontend/                    # React + TypeScript + Vite
│   └── src/
│       ├── App.tsx              # Router setup
│       ├── components/
│       │   ├── layout/
│       │   │   └── Layout.tsx   # Sidebar navigation
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── JobsPage.tsx
│       │   │   ├── JobDetailPage.tsx
│       │   │   ├── CreateJobPage.tsx
│       │   │   ├── ResumesPage.tsx
│       │   │   ├── ResumeDetailPage.tsx
│       │   │   ├── UploadPage.tsx
│       │   │   └── AnalyticsPage.tsx
│       │   └── ui/
│       │       └── index.tsx    # Reusable components
│       ├── hooks/
│       │   └── useAuth.tsx      # Auth context + hook
│       ├── lib/
│       │   └── api.ts           # Axios API client
│       └── types/
│           └── index.ts         # TypeScript interfaces
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- An **Anthropic API key** ([get one here](https://console.anthropic.com))

### 1. Clone & Install

```bash
git clone https://github.com/your-org/resume-screening-system.git
cd resume-screening-system

# Install all dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
JWT_SECRET=your-super-secret-key-change-in-production
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Run Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# API: http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App: http://localhost:5173
```

### 4. Login

| Role      | Email                    | Password         |
|-----------|--------------------------|------------------|
| Admin     | admin@company.com        | Admin@1234       |
| Recruiter | recruiter@company.com    | Recruiter@1234   |

---

## 🐳 Docker Deployment

```bash
# Copy and configure environment
cp backend/.env.example .env
# Edit .env with your ANTHROPIC_API_KEY and JWT_SECRET

# Build and run
docker compose --env-file .env up --build -d

# App: http://localhost:5173
# API: http://localhost:3001
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint         | Description       |
|--------|-----------------|-------------------|
| POST   | /api/auth/login  | Login, get JWT    |
| POST   | /api/auth/register | Register user   |
| GET    | /api/auth/me     | Get current user  |

### Jobs
| Method | Endpoint         | Description       |
|--------|-----------------|-------------------|
| GET    | /api/jobs        | List all jobs     |
| POST   | /api/jobs        | Create a job      |
| GET    | /api/jobs/:id    | Get job details   |
| PUT    | /api/jobs/:id    | Update job        |
| DELETE | /api/jobs/:id    | Delete job        |

### Resumes
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| POST   | /api/resumes/upload   | Upload resume files   |
| GET    | /api/resumes          | List all resumes      |
| GET    | /api/resumes/:id      | Get resume details    |
| PATCH  | /api/resumes/:id/status | Update status       |

### Screening (AI)
| Method | Endpoint                      | Description                     |
|--------|-------------------------------|---------------------------------|
| POST   | /api/screening/resume/:id     | Screen one resume with AI       |
| POST   | /api/screening/batch/:jobId   | Batch screen all pending        |
| GET    | /api/screening/result/:id     | Get screening result            |
| POST   | /api/screening/compare/:jobId | Compare shortlisted candidates  |

### Analytics
| Method | Endpoint               | Description           |
|--------|------------------------|-----------------------|
| GET    | /api/analytics/overview | Global stats          |
| GET    | /api/analytics/job/:id  | Per-job analytics     |

---

## 🧠 AI Screening Details

The AI scoring uses a weighted formula:

| Dimension      | Weight |
|----------------|--------|
| Skills Match   | 40%    |
| Experience     | 35%    |
| Education      | 15%    |
| Culture Fit    | 10%    |

**Status determination:**
- **Shortlisted** — Overall ≥ 75 AND Skills ≥ 70 AND Experience ≥ 65
- **Review** — Overall ≥ 55 AND (Skills ≥ 55 OR Experience ≥ 60)
- **Rejected** — Below thresholds or missing critical requirements

**Per-resume output includes:**
- Candidate profile extraction (name, email, phone, skills, experience)
- Detailed score breakdown
- Strengths with evidence
- Concerns and gaps
- Matched vs. missing requirements
- 3 tailored interview questions
- Executive summary + hiring recommendation

---

## 🔒 Security

- JWT authentication on all protected routes
- Role-based access control (Admin > Recruiter)
- Rate limiting: 100 req/15min globally, 10 req/min for AI endpoints
- File validation: type, size (max 10MB), content quality checks
- Helmet.js security headers
- CORS configured to frontend origin only

---

## 🗄️ Production Database

Replace the in-memory store (`backend/models/store.js`) with a real database:

**PostgreSQL (recommended):**
```bash
npm install pg drizzle-orm
# or
npm install pg sequelize
```

**MongoDB:**
```bash
npm install mongoose
```

The `db` object API in `store.js` provides a clean interface — swap the implementations without changing routes.

---

## 📦 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS |
| Charts    | Recharts                            |
| Routing   | React Router v6                     |
| HTTP      | Axios                               |
| Backend   | Node.js, Express.js                 |
| AI        | Anthropic Claude (claude-opus-4-5)  |
| Auth      | JWT (jsonwebtoken), bcryptjs        |
| Upload    | Multer                              |
| PDF Parse | pdf-parse                           |
| Logging   | Winston                             |
| Validation | Zod                                |
| Deploy    | Docker, Docker Compose, Nginx       |

---

## 📄 License

MIT — feel free to use and modify for your own hiring workflows.
>>>>>>> 803ece4 (Initial commit)
