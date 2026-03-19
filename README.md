<p align="center">
  <h1 align="center">🧭 Voyager</h1>
  <p align="center">
    <strong>AI-Powered Collaborative Trip Planning Platform</strong>
  </p>
  <p align="center">
    Plan smarter. Travel together. Powered by AI.
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#api-reference">API Reference</a>
  </p>
</p>

---

## 📖 Overview

**Voyager** is a full-stack, AI-powered travel planning platform that transforms how groups plan trips together. It combines a beautiful React-based frontend, a robust Node.js backend, and an intelligent **agentic AI engine** powered by Ollama and RAG (Retrieval-Augmented Generation) to deliver personalized, context-aware itineraries.

Whether you're planning a solo adventure or coordinating a group trip with friends, Voyager handles everything — from destination discovery and budget tracking to real-time collaborative itinerary building with an AI travel assistant.

---

## ✨ Features

### 🤖 AI-Powered Planning
- **Agentic Itinerary Generation** — Multi-step pipeline (Planner → Tools → Weather → Tips → RAG → Itinerary) that produces structured, day-by-day travel plans
- **AI Chat Assistant** — Conversational travel assistant with full trip context awareness (budget, preferences, saved places, shared notes)
- **RAG-Enhanced Knowledge** — ChromaDB vector store with travel knowledge (hotels, restaurants, attractions) for contextually grounded suggestions
- **Smart Replanning** — Modify existing itineraries intelligently without starting from scratch

### 👥 Collaborative Trip Planning
- **Real-Time Sync** — Socket.IO powered live updates for itinerary and budget changes across all participants
- **Group Preferences** — Poll-based preference voting (adventure, food, relaxation, etc.) that directly influences AI-generated plans
- **Shared Notes & Suggestions** — Participants can add notes and suggestions that the AI incorporates into planning
- **Trip Rooms** — Socket-based room management per trip for isolated real-time collaboration

### 🗺️ Trip Management
- **Trip Dashboard** — Overview of all your trips with status tracking (draft, confirmed, cancelled)
- **Trip Workspace** — Immersive workspace with tabbed navigation for itinerary, budget, and collaboration
- **Destination Discovery** — Browse and search destinations with interactive cards
- **Interactive Maps** — MapLibre GL integration for visualizing trip locations
- **Drag & Drop Itinerary** — Reorder activities with intuitive drag-and-drop

### 💰 Budget Tracking
- **Expense Management** — Track expenses by category (food, transport, accommodation, activities)
- **Split Billing** — Equal, shares-based, or percentage-based expense splitting among participants
- **Budget Estimates** — AI-generated categorized budget breakdowns for planned trips

### 🔐 Authentication & User Management
- **Firebase Auth** — Email/password and Google sign-in
- **User Profiles** — Persistent user data with Firestore
- **Protected Routes** — Auth-gated dashboard and trip pages

### 🎨 UI/UX
- **Dark/Light Mode** — Theme toggling with `next-themes`
- **Responsive Design** — Tailwind CSS v4 with mobile-first approach
- **Premium Components** — Built with Radix UI primitives and shadcn/ui
- **Smooth Animations** — Framer Motion powered transitions and micro-interactions
- **Rich Typography** — Geist font family for a modern, clean aesthetic

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **React Router v7** | Client-side routing |
| **Radix UI / shadcn** | Accessible UI primitives |
| **MUI (Material UI)** | Additional UI components |
| **Framer Motion** | Animations & transitions |
| **MapLibre GL** | Interactive maps |
| **Firebase SDK** | Auth & Firestore database |
| **Socket.IO Client** | Real-time communication |
| **Recharts** | Data visualization |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **Socket.IO** | WebSocket server for real-time events |
| **PostgreSQL + Sequelize** | Relational data storage |
| **MongoDB + Mongoose** | Document data storage |
| **Axios** | HTTP client (AI engine proxy) |
| **Helmet** | Security headers |
| **Morgan** | HTTP request logging |

### AI Engine
| Technology | Purpose |
|---|---|
| **Python + FastAPI** | AI API server |
| **Ollama (LLaMA 3)** | Local LLM for text generation |
| **ChromaDB** | Vector database for RAG |
| **Pydantic v2** | Schema validation for LLM output |
| **Uvicorn** | ASGI server |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VOYAGER PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │   Frontend    │    │   Backend    │    │    AI Engine      │   │
│  │  React + Vite │◄──►│  Express.js  │◄──►│  FastAPI + LLM   │   │
│  │  :5173        │    │  :5000       │    │  :8000            │   │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘   │
│         │                   │                     │             │
│         │              ┌────┴────┐          ┌─────┴─────┐       │
│         │              │ Socket  │          │  Ollama   │       │
│         │              │  .IO    │          │  (LLM)    │       │
│         │              └─────────┘          └─────┬─────┘       │
│         │                                         │             │
│  ┌──────┴───────┐    ┌─────────────┐       ┌──────┴──────┐      │
│  │   Firebase    │    │  PostgreSQL │       │  ChromaDB   │      │
│  │  Auth + DB    │    │  + MongoDB  │       │  (Vectors)  │      │
│  └──────────────┘    └─────────────┘       └─────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Action → React Frontend → Node.js Backend → AI Engine (FastAPI)
                                    │                    │
                                    │              Ollama LLM ← RAG Context (ChromaDB)
                                    │                    │
                                    ◄────────────────────┘
                                    │
                              Socket.IO broadcast → Other participants
```

---

## 📂 Project Structure

```
Voyager/
├── frontend/                    # React + Vite frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/      # App-specific components
│   │   │   │   ├── AIAssistantSidebar.tsx
│   │   │   │   ├── ItineraryPlanner.tsx
│   │   │   │   └── ui/          # Reusable UI components
│   │   │   ├── contexts/        # React context providers
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   ├── ItineraryContext.tsx
│   │   │   │   └── TripContext.tsx
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── layouts/
│   │   │   │   └── DashboardLayout.tsx
│   │   │   ├── pages/
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   ├── AuthPage.tsx
│   │   │   │   ├── TripDashboard.tsx
│   │   │   │   ├── TripWorkspace.tsx
│   │   │   │   ├── DestinationDiscovery.tsx
│   │   │   │   └── BudgetTracker.tsx
│   │   │   ├── routes.tsx       # Route definitions
│   │   │   └── App.tsx          # Root component
│   │   ├── components/ui/       # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── firebase.ts      # Firebase config & Firestore helpers
│   │   │   ├── aiApi.ts         # AI engine API client
│   │   │   ├── storage.ts       # Appwrite storage integration
│   │   │   └── utils.ts         # Utility functions
│   │   ├── styles/              # Global CSS & Tailwind config
│   │   └── main.tsx             # App entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # Node.js + Express API server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # PostgreSQL & MongoDB connections
│   │   ├── models/
│   │   │   ├── mongodb/         # Mongoose models
│   │   │   └── postgres/        # Sequelize models
│   │   ├── routes/
│   │   │   ├── aiRoutes.js      # AI engine proxy endpoints
│   │   │   ├── tripRoutes.js    # Trip CRUD operations
│   │   │   ├── itineraryRoutes.js
│   │   │   ├── budgetRoutes.js
│   │   │   └── placeRoutes.js
│   │   ├── services/
│   │   │   ├── aiService.js     # AI engine communication
│   │   │   └── dataHelper.js    # Database helpers
│   │   ├── sockets/             # Socket.IO event handlers
│   │   └── app.js               # Express app setup
│   ├── server.js                # Server entry point
│   └── package.json
│
├── ai-engine/                   # Python FastAPI AI service
│   ├── agents/
│   │   ├── planner_agent.py     # Trip planning orchestrator
│   │   ├── itinerary_agent.py   # Day-by-day itinerary builder
│   │   └── modification_agent.py # Itinerary modification handler
│   ├── services/
│   │   ├── planning_service.py  # End-to-end planning pipeline
│   │   ├── itinerary_service.py # Itinerary generation logic
│   │   ├── itinerary_modifier.py
│   │   └── rag_service.py       # RAG retrieval service
│   ├── rag/
│   │   ├── vector_store.py      # ChromaDB vector store management
│   │   ├── retriever.py         # Context retrieval for LLM
│   │   └── ingest_data.py       # Dataset ingestion pipeline
│   ├── tools/
│   │   ├── weather_tool.py      # Weather data fetcher
│   │   ├── attraction_tool.py   # Attraction recommendations
│   │   ├── hotel_tool.py        # Hotel suggestions
│   │   ├── restaurant_tool.py   # Restaurant finder
│   │   ├── budget_tool.py       # Budget estimation
│   │   ├── destination_tool.py  # Destination info
│   │   └── travel_tip_tool.py   # Local tips & advice
│   ├── prompts/                 # LLM prompt templates
│   ├── schemas/                 # Pydantic response schemas
│   ├── llm/                     # Ollama client wrapper
│   ├── datasets/                # Travel knowledge datasets (JSON)
│   │   ├── attractions.json
│   │   ├── hotels.json
│   │   └── restaurants.json
│   ├── config.py                # Central configuration
│   ├── api.py                   # FastAPI application
│   ├── main.py                  # CLI entry point & data ingestion
│   └── requirements.txt
│
├── start.bat                    # One-click launcher (Windows)
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | v18+ |
| **Python** | v3.10+ |
| **Ollama** | Latest |
| **PostgreSQL** | v14+ |
| **MongoDB** | v6+ |

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Voyager.git
cd Voyager
```

### 2. Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_BACKEND_URL=http://localhost:5000
```

**Backend** (`backend/.env`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/voyager
POSTGRES_URI=postgresql://user:password@localhost:5432/voyager
AI_ENGINE_URL=http://localhost:8000
```

### 3. Install Ollama & Pull a Model

```bash
# Install Ollama from https://ollama.com
ollama pull llama3
ollama serve
```

### 4. Quick Start (Windows)

The easiest way to run the entire stack:

```bash
# From the project root
start.bat
```

This automatically installs dependencies (on first run) and launches all three services in separate terminal windows.

### 5. Manual Setup

If you prefer to set up each service individually:

#### AI Engine (Port 8000)
```bash
cd ai-engine
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

# Ingest travel datasets into ChromaDB (first-time only)
python main.py --ingest

# Start the server
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

#### Backend (Port 5000)
```bash
cd backend
npm install
npm run dev
```

#### Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

### 6. Access the App

| Service | URL |
|---|---|
| 🌐 **Frontend** | [http://localhost:5173](http://localhost:5173) |
| ⚙️ **Backend API** | [http://localhost:5000](http://localhost:5000) |
| 🤖 **AI Engine** | [http://localhost:8000](http://localhost:8000) |
| 📚 **AI Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

## 📡 API Reference

### AI Engine Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns LLM & RAG status |
| `POST` | `/api/plan` | Generate a full AI itinerary |
| `POST` | `/api/chat` | Chat with the AI travel assistant |
| `POST` | `/api/replan` | Modify an existing itinerary |

### Backend Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/generate-itinerary` | Proxy to AI engine `/api/plan` |
| `POST` | `/api/ai/chat` | Proxy to AI engine `/api/chat` |
| `GET/POST` | `/api/trips/*` | Trip CRUD operations |
| `GET/POST` | `/api/itinerary/*` | Itinerary management |
| `GET/POST` | `/api/budget/*` | Budget & expense tracking |
| `GET/POST` | `/api/places/*` | Saved places management |

### Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `join_trip` | Client → Server | Join a trip's real-time room |
| `itinerary_update` | Client → Server | Broadcast itinerary change |
| `itinerary_updated` | Server → Client | Receive itinerary change |
| `budget_update` | Client → Server | Broadcast budget change |
| `budget_updated` | Server → Client | Receive budget change |

---

## 🧠 AI Pipeline

The AI engine uses a multi-agent, multi-step pipeline:

```
 ┌─────────────────────────────────────────────────┐
 │            User Request (Natural Language)        │
 └───────────────────────┬─────────────────────────┘
                         ▼
 ┌─────────────────────────────────────────────────┐
 │  1. Planner Agent                                │
 │     Extracts: destination, duration, budget,     │
 │     preferences, constraints                     │
 └───────────────────────┬─────────────────────────┘
                         ▼
 ┌─────────────────────────────────────────────────┐
 │  2. Tool Execution                               │
 │     🌤️ Weather  🏨 Hotels  🍽️ Restaurants        │
 │     🎡 Attractions  💰 Budget  💡 Travel Tips     │
 └───────────────────────┬─────────────────────────┘
                         ▼
 ┌─────────────────────────────────────────────────┐
 │  3. RAG Retrieval (ChromaDB)                     │
 │     Enriches context with travel knowledge       │
 └───────────────────────┬─────────────────────────┘
                         ▼
 ┌─────────────────────────────────────────────────┐
 │  4. Itinerary Agent                              │
 │     Generates structured day-by-day plan         │
 │     with activities, budget, and tips            │
 └───────────────────────┬─────────────────────────┘
                         ▼
 ┌─────────────────────────────────────────────────┐
 │         Structured JSON Itinerary Response       │
 └─────────────────────────────────────────────────┘
```

---

## 🛠️ Development

### Running Tests (AI Engine)

```bash
cd ai-engine
source venv/bin/activate
python test_phase0.py    # Basic LLM connectivity
python test_phase1.py    # Tool execution pipeline
python test_phase2.py    # RAG integration
```

### Building for Production

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

---

## 📄 License

This project is licensed under the ISC License.

---

<p align="center">
  Made with ❤️ by the Voyager Team
</p>
