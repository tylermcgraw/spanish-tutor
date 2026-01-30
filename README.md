# Spanish AI Companion (Tavus Integration)

An AI-powered Spanish companion that adapts to your vocabulary level using real-time visual feedback.

## Setup

1.  **Prerequisites:**
    - Node.js (v18+)
    - PostgreSQL (running locally)
    - Tavus API Key

2.  **Environment Variables:**
    - Create a `.env` file in the root directory:
      ```
      TAVUS_API_KEY=your_key_here
      DATABASE_URL=postgresql://user:password@localhost:5432/spanish_tutor
      ```

3.  **Database:**
    - Create a database named `spanish_tutor`.
    - Run the initialization script:
      ```bash
      cd backend
      node init_db.js
      ```

4.  **Installation:**
    - Backend:
      ```bash
      cd backend
      npm install
      ```
    - Frontend:
      ```bash
      cd frontend
      npm install
      ```

## Running the Application

1.  **Start Backend:**
    ```bash
    cd backend
    npm start # (or npm run dev for nodemon)
    ```

2.  **Start Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

3.  Open http://localhost:5173 to start your lesson.

## Architecture

- **Frontend:** React, Vite, Tailwind CSS, @daily-co/daily-js
- **Backend:** Node.js, Express, PostgreSQL
- **AI/Video:** Tavus (Phoenix, Raven-2)
