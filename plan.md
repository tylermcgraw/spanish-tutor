# Project Plan: Spanish Tutor

## Phase 0: Setup & Infrastructure
- [x] **Scaffold Project Structure**
    - [x] Create `/frontend` using Vite (React + TypeScript).
    - [x] Create `/backend` directory (Node.js/Express).
    - [x] Initialize git and add remote `https://github.com/tylermcgraw/spanish-tutor.git`.
- [x] **Frontend Dependencies**
    - [x] Install `@daily-co/daily-js`
    - [x] Install `axios`
    - [x] Install Tailwind CSS
- [x] **Backend Setup**
    - [x] Initialize Node.js project in `/backend`
    - [x] Install `pg` (PostgreSQL client), `express`, `cors`, `dotenv`, `axios`.
- [x] **Database**
    - [x] Setup local PostgreSQL database `spanish_tutor` (User to confirm running instance).
    - [x] Create table `vocabulary` with schema: `(student_id VARCHAR, word VARCHAR, exposures INT, score FLOAT, status VARCHAR, PRIMARY KEY (student_id, word))`.

## Phase 1: Backend Implementation (The "Tavus Bridge")
- [x] **Implement Express Server**
    - [x] Create `backend/server.js` (or `.ts`).
    - [x] **Endpoint: `POST /api/conversation`**
        - [x] Load `TAVUS_API_KEY`
        - [x] POST to `https://api.tavus.video/v2/conversations`
        - [x] Body: `replica_id` ("r6ae5b6efc9d"), `system_prompt` ("Virginia"), `context` (fetched from DB).
        - [x] Return `conversation_url` and `conversation_id`.
    - [x] **Endpoint: `POST /api/vocabulary`** (or sync mechanism)
        - [x] Update word stats in PostgreSQL.

## Phase 2: Frontend Core (Video Interface)
- [x] **Basic UI Shell**
    - [x] Setup Tailwind CSS styling.
    - [x] Create main layout.
- [x] **Video Component**
    - [x] Create `VideoPlayer.tsx`.
    - [x] Integrate `@daily-co/daily-js` to join the call using the URL from the backend.
- [x] **Start Session Flow**
    - [x] Button to "Start Lesson".
    - [x] Call Backend API (`/api/conversation`).
    - [x] Initialize Video Player with returned URL.

## Phase 3: Adaptive Logic & Feedback (The "Loop")
- [x] **Tavus Event Listeners**
    - [x] Listen for `app-message` (Perception/Raven data).
    - [x] Listen for transcript events.
- [x] **Confusion Trigger**
    - [x] Implement `useConfusionMonitor` hook (Inline logic).
    - [x] Logic: Check `perception.user_state` for "confused".
    - [x] Implement debounce.
    - [x] Send signal back to Tavus.
- [x] **Stats Overlay**
    - [x] Create overlay component.
    - [x] Display "Words Learned" (real-time).

## Phase 4: Vocabulary Engine (Persistence)
- [x] **Backend Integration**
    - [x] Connect `POST /api/vocabulary` to `pg` client.
- [x] **Frontend-Backend Sync**
    - [x] On utterance complete -> Update Backend.
    - [x] On session start -> Fetch user's `vocabulary`.

## Phase 5: Polish & Verify
- [x] **Styling Refinement**
    - [x] Ensure UI is clean.
- [x] **Testing**
    - [x] Manual verification.
