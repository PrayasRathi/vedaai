# VedaAI – AI Assessment Creator 🎓

> Full-stack AI-powered question paper generator for teachers.
> Built with Next.js 14, Node.js, MongoDB, Redis, BullMQ, WebSockets, and Groq AI (Llama 3.3 70B).

---

## 🔗 Submission Links
- **Frontend (Live):** https://greetings-app-e5ox.vercel.app
- **GitHub (Monorepo):** https://github.com/PrayasRathi/vedaai

> **Backend Note:** The backend uses persistent WebSocket connections
> and BullMQ worker processes which are incompatible with Vercel
> serverless. It runs perfectly locally — full setup below.

---

## 🏗️ System Architecture

┌─────────────────────────────────────────────────────────┐
│                    TEACHER (Browser)                     │
└─────────────────────┬───────────────────────────────────┘
│ HTTP REST + WebSocket
▼
┌─────────────────────────────────────────────────────────┐
│              Next.js 14 Frontend (Vercel)                │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Zustand    │  │  WebSocket   │  │  PDF Export   │  │
│  │   Store     │  │  Hook (auto  │  │  jsPDF +      │  │
│  │             │  │  reconnect)  │  │  html2canvas  │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                                                         │
│  Pages: /assignments  /assignments/create  /assignments/[id] │
└─────────────────────┬───────────────────────────────────┘
│ API calls
▼
┌─────────────────────────────────────────────────────────┐
│           Express Backend (Node.js + TypeScript)         │
│                                                         │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  REST API    │  │ WebSocket  │  │   Middleware    │  │
│  │  /api/assign │  │  Server    │  │ Helmet + CORS  │  │
│  │  ments       │  │            │  │ Rate Limiting  │  │
│  └──────────────┘  └────────────┘  │ Zod Validation │  │
│                                    └────────────────┘  │
└──────┬──────────────────────┬───────────────────────────┘
│                      │
▼                      ▼
┌─────────────┐      ┌────────────────┐
│   MongoDB   │      │  Redis(Upstash)│
│             │      │                │
│ Assignments │      │ BullMQ Queue   │
│ Question    │      │ Cache (30s)    │
│ Papers      │      │                │
└─────────────┘      └───────┬────────┘
│ Job Queue
▼
┌──────────────────────────┐
│      BullMQ Worker        │
│                          │
│  1. Dequeue job          │
│  2. Call Groq AI         │
│     (Llama 3.3 70B)      │
│  3. Parse + Validate JSON│
│  4. Save to MongoDB      │
│  5. Notify via WebSocket │
└──────────────────────────┘

---

## ✨ Features

### Core
- ✅ Assignment creation with drag-drop file upload (PDF/image)
- ✅ Dynamic question types with +/− counters for count & marks
- ✅ Full form validation (no empty/negative/zero values)
- ✅ Zustand state management
- ✅ BullMQ background jobs (3 retries, exponential backoff)
- ✅ Redis caching (30s list, 5min completed papers)
- ✅ WebSocket real-time progress with auto-reconnect
- ✅ Structured question paper (sections, difficulty tags, marks)
- ✅ Student info section (Name, Roll No, Class, Section)
- ✅ Raw AI output never rendered — always parsed and validated

### Bonus
- ✅ PDF download (jsPDF + html2canvas, multi-page)
- ✅ Regenerate with duplicate job prevention
- ✅ Difficulty badges (Easy / Moderate / Hard)
- ✅ Search and filter assignments
- ✅ Delete assignments
- ✅ Mobile responsive
- ✅ Progress animation with step indicators
- ✅ Redis 800ms timeout fallback to MongoDB

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Zustand, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB + Mongoose |
| Cache/Queue | Redis (Upstash) + BullMQ |
| Real-time | WebSocket (ws library) |
| AI | Groq API — Llama 3.3 70B |
| Security | Helmet, express-rate-limit, Zod |
| PDF | jsPDF + html2canvas |

---

## 📁 Project Structure (Monorepo)


vedaai/                          ← monorepo root
├── package.json                 ← runs all with npm run dev
├── README.md
│
├── frontend/                    ← Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── assignments/
│   │   │   │   ├── page.tsx     ← list (empty + filled)
│   │   │   │   ├── create/      ← create form
│   │   │   │   └── [id]/        ← output page
│   │   ├── components/
│   │   │   ├── Sidebar.tsx      ← Figma-matched
│   │   │   └── Topbar.tsx
│   │   ├── store/
│   │   │   └── assignmentStore.ts ← Zustand
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts  ← auto-reconnect
│   │   └── lib/api.ts
│   └── .env.local
│
└── backend/                     ← Express server
├── src/
│   ├── index.ts             ← server + WS init
│   ├── worker.ts            ← BullMQ worker
│   ├── models/
│   │   └── Assignment.ts    ← MongoDB schema
│   ├── routes/
│   │   └── assignments.ts   ← REST endpoints
│   └── services/
│       ├── aiService.ts     ← Groq + JSON parser
│       ├── queue.ts         ← BullMQ
│       ├── redis.ts         ← Redis connection
│       └── websocket.ts     ← WS subscriptions
└── .env.example


---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally
- Redis (free cloud at upstash.com)
- Groq API key (free at console.groq.com)

### 1. Clone & Install
```bash
git clone https://github.com/PrayasRathi/vedaai.git
cd vedaai
npm install
npm run install:all
```

### 2. Environment Variables

**backend/.env**
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws
```

### 3. Start MongoDB
```bash
# Windows
& "C:\Program Files\MongoDB\bin\mongod.exe" --dbpath D:\mongodata

# Mac/Linux
mongod --dbpath ~/mongodata
```

### 4. Run with single command
```bash
npm run dev
```

Starts all 3 simultaneously:
- ✅ Backend API → http://localhost:4000
- ✅ BullMQ Worker
- ✅ Frontend → http://localhost:3000

---

## 🔄 Request Flow
POST /api/assignments
↓
Zod validation + save to MongoDB
↓
BullMQ job enqueued
↓
Frontend subscribes via WebSocket
↓
Worker picks job → calls Groq AI
↓
JSON parsed + validated (3 retries)
↓
Saved to MongoDB
↓
WebSocket notifies frontend instantly
↓
Question paper renders with sections + badges


---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/assignments` | List all (cached 30s) |
| GET | `/api/assignments/:id` | Get with question paper |
| POST | `/api/assignments` | Create + queue AI job |
| DELETE | `/api/assignments/:id` | Delete |
| POST | `/api/assignments/:id/regenerate` | Regenerate paper |

---

## 🔒 Security
- Helmet HTTP security headers
- CORS restricted to frontend URL
- Rate limiting: 100/15min general, 5/min AI endpoint
- Zod validation on all inputs
- File upload: PDF/image only, max 10MB
- Secrets via environment variables only

---

## 👨‍💻 Developer
**Prayas Rathi**
B.Tech CSE — IIITDM Jabalpur (2026)
GitHub: https://github.com/PrayasRathi