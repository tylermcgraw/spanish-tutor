# Spanish Tutor - Project Documentation

## 1. Project Overview
Spanish Tutor is an AI-powered language learning application built for the Tavus Customer Advocate take-home project. It utilizes Tavus's Conversational Video Interface (CVI) to facilitate "Active Crosstalk"—a language acquisition method where the AI tutor speaks exclusively in Spanish (L2) while the student responds in English (L1).

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

### A. The "Tavus Bridge" (Backend)
- **Endpoint:** `POST /api/conversation`
- **Flow:**
  1.  Fetches student's vocabulary from PostgreSQL.
  2.  Constructs `conversational_context` string containing:
      - Categorized vocabulary ("Mastered" vs "Learning").
      - **Mandatory Greeting Instruction:** Explicitly tells the AI to start with "¡Hola! Soy Virginia..." (bypassing the need for a root `greeting` param).
  3.  Calls Tavus API (`/v2/conversations`) using a pre-created `persona_id`.
  4.  Returns `conversation_url` to frontend.
- **Persona:** "Virginia" (Created once via `backend/create_persona.js`).
  - System Prompt: Defines the "No English" rule and teaching style.
  - ID stored in `.env` as `PERSONA_ID`.

### B. Vocabulary Mastery Engine
Tracks word-level proficiency using a dedicated `useVocabulary` hook in the frontend.
- **Metrics:**
  - **Words Learned:** Count of words with a `score > 5` (Mastered).
  - **Words Seen:** Total count of unique words encountered in the user's vocabulary.
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
- **Real-time Processing:**
  - Frontend listens for `conversation.message` (role: replica) events via `app-message`.
  - Tokenizes transcript, updates local counters, and auto-upgrades status (New -> Learning -> Mastered).
- **Persistence:**
  - Session data is saved to `POST /api/vocabulary` when the user leaves the call.

### C. The Adaptive Loop (Frontend)
- **Video Player:** Renders Tavus stream using `DailyProvider`.
- **Perception Listener:** Listens for `app-message` events from Tavus (Raven).
  - Triggers: `user_state === 'confused'` or `gaze_averting`.
- **Confusion Logic:**
  - If confusion detected (or "Debug" button clicked):
    1. Update local UI state (Difficulty: Easy).
    2. Sends `app-message` back to Tavus with specific system instruction:
       `"[System Instruction: User looks confused. Rephrase the last point simply using basic vocabulary. Do not switch to English.]"`
  - Logic resets to "Normal" after a timeout.

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
