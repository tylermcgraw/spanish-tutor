# Spanish AI Companion - Project Documentation

## 1. Project Overview
Spanish AI Companion is an AI-powered language learning application built for the Tavus Customer Advocate take-home project. It utilizes Tavus's Conversational Video Interface (CVI) to facilitate "Active Crosstalk"—a language acquisition method where the AI tutor speaks exclusively in Spanish (L2) while the student responds in English (L1).

The goal is to maintain Comprehensible Input (95% understanding) by using real-time visual perception and word-level memory to dynamically adjust the tutor's vocabulary and complexity.

## 2. Technical Stack
- **Frontend:** React (Vite), TypeScript, Tailwind CSS (v4)
  - *Note:* React Strict Mode is **enabled**. The project uses robust iframe detection and `@daily-co/daily-react` to handle lifecycle management.
- **Video/Audio:** `@daily-co/daily-js` & `@daily-co/daily-react` (WebRTC)
- **Backend:** Node.js (Express) local server
- **Database:** Local PostgreSQL
  - Table: `vocabulary` (Tracks student mastery)
- **Key APIs:** Tavus CVI (Phoenix for video, Raven-1 for perception, Sparrow for orchestration)
  - Base URL: `https://tavusapi.com`

## 3. Architecture & Data Flow

### A. The "Tavus Bridge" & Buffering (Backend)
- **Endpoint:** `POST /api/conversation`
- **Flow:**
  1.  Fetches student's vocabulary from PostgreSQL.
  2.  Constructs `conversational_context` (Mastered vs Learning words).
  3.  Calls Tavus API; returns `conversation_url` and `conversation_id`.
- **Real-time Tracking (Buffering):**
  - **Endpoint:** `POST /api/track-utterance`
  - When the frontend receives a transcript, it sends it to this endpoint.
  - The backend **buffers** word counts in an in-memory `activeSessions` Map (keyed by `conversation_id`). No database writes occur during the call.

### B. Vocabulary Mastery Engine
- **Persistence (Webhook):**
  - **Endpoint:** `POST /webhook`
  - The backend listens for Tavus `system.shutdown` events.
  - **On Shutdown:** The server flushes the buffer to the database. It calculates new scores (0.1 per exposure) and updates statuses (New -> Learning -> Mastered) in a single transaction.
- **Database Schema (Postgres):**
  ```sql
  CREATE TABLE vocabulary (
    student_id VARCHAR(255),
    word VARCHAR(255),
    exposures INT DEFAULT 0,
    score FLOAT DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'new',
    PRIMARY KEY (student_id, word)
  );
  ```

### C. The Adaptive Loop (Frontend)
- **Transcript Processing:** Frontend listens for `conversation.utterance` events.
- **Syncing:** Calls backend `track-utterance` for persistence and updates local state for optimistic UI stats (Words Learned/Seen).
- **Confusion Logic:**
  - If confusion detected: Sends `app-message` (type: `context_update`) to Tavus with a system instruction to simplify language.

## 4. Implementation Details & Gotchas
- **Tavus API:**
  - `system_prompt` is for **Persona creation**, not Conversation creation.
  - Use `conversational_context` in `/v2/conversations` to inject dynamic data (vocabulary) and specific behavioral overrides (like the greeting).
- **Frontend Types:**
  - `tsconfig.app.json` has `verbatimModuleSyntax: true`.
  - Must use `import type { DailyCall }` for types to avoid runtime errors.
- **Environment Variables:**
  - `TAVUS_API_KEY`: API Key.
  - `DATABASE_URL`: Postgres connection string.
  - `PERSONA_ID`: ID of the "Virginia" persona.

## 5. Development Workflow
1.  **Start Backend:** `cd backend && npm run dev` (Port 3001)
2.  **Start Frontend:** `cd frontend && npm run dev` (Port 5173)
3.  **Database:** Ensure local Postgres is running.
4.  **Debugging:** Use the "Debug: Trigger Confusion" button in the UI to simulate Tavus perception events.
