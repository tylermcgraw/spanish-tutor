# Implementation Plan - Status: Complete

## Goal
Update user vocabulary when the Tavus session ends (`system.shutdown` webhook), restructuring the app to store vocabulary state in the backend using a **buffering strategy** to minimize DB writes.

## Completed Tasks
- [x] **Backend**: Create `POST /api/track-utterance` endpoint.
    - [x] Accepts `{ student_id, text, conversation_id }`.
    - [x] **Buffering**: Stores word counts in an in-memory `activeSessions` Map instead of writing to DB immediately.
- [x] **Backend**: Implement `POST /webhook` handler.
    - [x] Detect `event_type: 'system.shutdown'`.
    - [x] **Flush**: Retrieves buffered data for the `conversation_id`.
    - [x] Fetches current DB stats, calculates new scores/status, and performs a Bulk Upsert.
    - [x] Clears the memory buffer.
- [x] **Frontend**: Update `api.ts` to include `trackUtterance`.
- [x] **Frontend**: Refactor `useVocabulary.ts`.
    - [x] Remove local `saveSession` and `beforeunload` logic.
    - [x] Call `trackUtterance` inside `processTranscript`.
    - [x] Keep optimistic local state for UI stats.
- [x] **Frontend**: Update `App.tsx`.
    - [x] Capture `conversation_id` from start response.
    - [x] Pass `conversation_id` to vocabulary hook/functions.
    - [x] Remove unused imports and legacy code.

## Verification
- Frontend build passed.
- Backend code syntax checked (`node -c backend/server.js`).
- Logic review: Buffering correctly handles session accumulation and atomic DB updates on shutdown.
