# VedaAI – AI Assessment Creator

> Full-stack AI-powered question paper generator for teachers. Built with Next.js, Node.js, MongoDB, Redis, BullMQ, and Claude AI.

---

## Live Architecture

```
Teacher (Browser)
      │
      │  HTTP REST + WebSocket
      ▼
┌─────────────────────────────────┐
│  Next.js Frontend (Port 3000)   │
│  - Zustand state management     │
│  - WebSocket real-time updates  │
│  - Figma-matched UI             │
└───────────────┬─────────────────┘
                │ API calls
                ▼
┌─────────────────────────────────┐
│  Express Backend (Port 4000)    │
│  - REST API routes              │
│  - WebSocket server (ws://)     │
│  - File upload (multer)         │
│  - Zod validation               │
└──────┬──────────────┬───────────┘
       │              │
       ▼              ▼
┌──────────┐   ┌─────────────┐
│ MongoDB  │   │   Redis     │
│ Stores:  │   │ - Job queue │
│ -Assigns │   │ - Caching   │
│ -Papers  │   │   (30s TTL) │
└──────────┘   └──────┬──────┘
                      │ BullMQ
                      ▼
            ┌─────────────────┐
            │  Worker Process  │
            │  - Dequeues jobs │
            │  - Calls Claude  │
            │  - Parses JSON   │
            │  - Saves to DB   │
            │  - WS notify     │
            └─────────────────┘
```

## Flow: Assignment Creation

1. Teacher fills form → clicks **Next**
2. Frontend sends `POST /api/assignments` with FormData (file optional)
3. Backend validates with Zod, saves to MongoDB, enqueues BullMQ job
4. Returns `{ assignment, jobId }` → frontend navigates to `/assignments/:id`
5. Frontend subscribes to WebSocket for that `assignmentId`
6. **Worker** picks up the job:
   - Updates status → `processing`
   - Sends WS event: `{ type: 'status', progress: 10 }`
   - Calls Claude API with structured prompt
   - Parses and validates JSON response
   - Saves `questionPaper` to MongoDB
   - Sends WS event: `{ type: 'completed', questionPaper: {...} }`
7. Frontend updates UI instantly via WebSocket — no polling needed

---

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | Next.js 14, TypeScript, Zustand, Tailwind CSS |
| Backend   | Node.js, Express, TypeScript |
| Database  | MongoDB + Mongoose  |
| Cache/Queue | Redis + BullMQ   |
| Real-time | WebSocket (ws)      |
| AI        | Anthropic Claude (claude-opus-4-5) |
| PDF Export | jsPDF + html2canvas |

---

## Project Structure

```
vedaai/
├── frontend/               # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── assignments/
│   │   │   │   ├── page.tsx          # List view (empty + filled)
│   │   │   │   ├── create/page.tsx   # Create form
│   │   │   │   └── [id]/page.tsx     # Output / detail view
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   ├── store/
│   │   │   └── assignmentStore.ts    # Zustand store
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   └── lib/
│   │       └── api.ts
│   └── .env.local
│
└── backend/                # Express server
    ├── src/
    │   ├── index.ts          # Server entry + WS init
    │   ├── worker.ts         # BullMQ worker
    │   ├── models/
    │   │   └── Assignment.ts
    │   ├── routes/
    │   │   └── assignments.ts
    │   └── services/
    │       ├── aiService.ts  # Claude prompt + parsing
    │       ├── queue.ts      # BullMQ setup
    │       ├── redis.ts
    │       └── websocket.ts
    └── .env.example
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`
- Anthropic API key

### 1. Clone & Install

```bash
git clone <your-repo>
cd vedaai

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env → add your ANTHROPIC_API_KEY

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

**backend/.env**
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=development
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws
```

### 3. Start Services

```bash
# Terminal 1 – MongoDB (if not running as a service)
mongod

# Terminal 2 – Redis
redis-server

# Terminal 3 – Backend API server
cd backend && npm run dev

# Terminal 4 – Background worker
cd backend && npm run worker

# Terminal 5 – Frontend
cd frontend && npm run dev
```

Open: http://localhost:3000

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/assignments` | List all assignments (cached 30s) |
| GET | `/api/assignments/:id` | Get single assignment + question paper |
| POST | `/api/assignments` | Create + enqueue AI generation |
| DELETE | `/api/assignments/:id` | Delete assignment |
| POST | `/api/assignments/:id/regenerate` | Re-run AI generation |
| GET | `/health` | Health check |

**WebSocket:** `ws://localhost:4000/ws`
- Send: `{ type: 'subscribe', assignmentId: '...' }`
- Receive: `{ type: 'status' | 'completed' | 'failed', progress, questionPaper? }`

---

## AI Prompt Design

The prompt is structured to:
1. Receive subject, question types, counts, marks, and optional file content
2. Return **strict JSON only** (no markdown fences)
3. Group questions into sections (Section A, B, C…)
4. Distribute difficulty: ~40% easy, 40% medium, 20% hard
5. Include proper MCQ options when type is `mcq`

The response is parsed, validated, and enriched with UUIDs and computed totals before saving — **raw AI output is never rendered directly**.

---

## Features

### Core
- ✅ Assignment creation form with file upload (PDF/image)
- ✅ Question type selector with per-type count + marks counters
- ✅ Zod validation (frontend + backend)
- ✅ Zustand state management
- ✅ BullMQ background job queue with retry (3 attempts, exponential backoff)
- ✅ Redis caching (assignment list: 30s, completed papers: 5min)
- ✅ WebSocket real-time progress updates
- ✅ Structured question paper output (sections, difficulty tags, marks)
- ✅ Student info section (Name, Roll No, Class, Section)

### Bonus
- ✅ PDF download (jsPDF + html2canvas, multi-page)
- ✅ Regenerate action
- ✅ Difficulty badges (Easy/Moderate/Hard with color coding)
- ✅ Delete assignments
- ✅ Mobile-responsive layout
- ✅ Progress animation with step indicators

---

## Design Notes

- Matches Figma design: white sidebar, black pill buttons, `#F0F0F0` page background
- VedaAI logo with black square mark
- Empty state with illustration when no assignments
- Assignment cards with status badges, date display
- Question paper in serif font (Georgia) for authentic exam paper feel
- Print-optimized CSS (sidebar hidden, no-print classes)
