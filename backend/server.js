const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const PERSONA_ID = process.env.PERSONA_ID;
const TAVUS_API_URL = 'https://tavusapi.com/v2/conversations';
const CALLBACK_URL = process.env.CALLBACK_URL;

app.get('/api/vocabulary/:studentId', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM vocabulary WHERE student_id = $1', [req.params.studentId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/vocabulary', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { student_id, words } = req.body;
    
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: 'Invalid body, expected "words" array.' });
    }

    await client.query('BEGIN');

    const upsertQuery = `
      INSERT INTO vocabulary (student_id, word, exposures, score, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (student_id, word)
      DO UPDATE SET exposures = $3, score = $4, status = $5;
    `;

    for (const item of words) {
       await client.query(upsertQuery, [
         student_id, 
         item.word, 
         item.exposures, 
         item.score, 
         item.status
       ]);
    }

    await client.query('COMMIT');
    res.json({ success: true, count: words.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

app.post('/api/conversation', async (req, res) => {
  try {
    const { student_id } = req.body;
    // Default to 'tyler' if not provided for now
    const safeStudentId = student_id || 'tyler';
    
    console.log(`Creating conversation with Persona ID: ${PERSONA_ID}`);

    const { rows } = await db.query('SELECT word, status, score FROM vocabulary WHERE student_id = $1', [safeStudentId]);
    
    // Group vocabulary for better context
    const knownWords = rows.filter(r => r.score > 5).map(r => r.word).join(', ');
    const learningWords = rows.filter(r => r.score <= 5).map(r => r.word).join(', ');
    
    const contextString = `
      Student ID: ${safeStudentId}.
      Vocabulary Status:
      - Mastered/Known Words: [${knownWords || "None"}]
      - Currently Learning: [${learningWords || "None"}]
      
      INSTRUCTION: Prioritize using "Mastered" words to build confidence. Introduce "Learning" words slowly. 
      If the list is empty, start with very basic A1 greetings and cognates.
    `;

    const response = await axios.post(TAVUS_API_URL, {
      persona_id: PERSONA_ID || req.body.persona_id,
      callback_url: CALLBACK_URL,
      conversation_name: `Spanish Lesson for ${safeStudentId}`,
      conversational_context: contextString,
      custom_greeting: 'Hola, soy Virginia. Como estas?',
      properties: {
        'language': 'spanish',
      }
    }, {
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error creating conversation:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create conversation', 
      details: error.response?.data || error.message 
    });
  }
});

// In-memory buffer for active sessions
// Map<conversationId, { studentId: string, wordCounts: Map<word, count> }>
const activeSessions = new Map();

// Helper to buffer vocabulary in memory
const bufferVocabulary = (conversationId, studentId, text) => {
  if (!text || !conversationId) return;
  
  // Initialize session buffer if needed
  if (!activeSessions.has(conversationId)) {
    activeSessions.set(conversationId, {
      studentId,
      wordCounts: new Map() // word -> count
    });
  }

  const session = activeSessions.get(conversationId);
  
  // Tokenize
  const words = text.toLowerCase().match(/[a-záéíóúñü]+/g);
  if (!words) return;

  for (const word of words) {
    if (word.length < 3) continue;
    const currentCount = session.wordCounts.get(word) || 0;
    session.wordCounts.set(word, currentCount + 1);
  }
};

app.post('/api/track-utterance', async (req, res) => {
  const { student_id, text, conversation_id } = req.body;
  
  if (!student_id || !text || !conversation_id) {
    // console.warn("Missing data in track-utterance", req.body);
    // Fail silently or return error? Returning 400 is safer for debugging.
    return res.status(400).json({ error: 'Missing student_id, text, or conversation_id' });
  }

  try {
    bufferVocabulary(conversation_id, student_id, text);
    res.json({ success: true, buffered: true });
  } catch (err) {
    console.error('Error buffering utterance:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const flushSessionToDb = async (conversationId) => {
  if (!activeSessions.has(conversationId)) {
    console.log(`[Flush] No active session found for ID: ${conversationId}`);
    return;
  }

  const session = activeSessions.get(conversationId);
  const { studentId, wordCounts } = session;

  if (wordCounts.size === 0) {
    activeSessions.delete(conversationId);
    return;
  }

  const client = await db.pool.connect();
  try {
    console.log(`[Flush] Saving ${wordCounts.size} words for student ${studentId}...`);
    await client.query('BEGIN');

    // 1. Fetch current stats for all words in this session
    const wordsArray = Array.from(wordCounts.keys());
    const queryText = 'SELECT word, exposures, score, status FROM vocabulary WHERE student_id = $1 AND word = ANY($2)';
    const { rows } = await client.query(queryText, [studentId, wordsArray]);
    
    // Map current DB stats for easy lookup
    const dbStats = new Map();
    rows.forEach(r => dbStats.set(r.word, r));

    // 2. Prepare UPSERTs
    const upsertQuery = `
      INSERT INTO vocabulary (student_id, word, exposures, score, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (student_id, word)
      DO UPDATE SET exposures = $3, score = $4, status = $5
    `;

    for (const [word, count] of wordCounts.entries()) {
      const current = dbStats.get(word) || { exposures: 0, score: 0, status: 'new' };
      
      const newExposures = current.exposures + count;
      const newScore = current.score + (count * 0.1); // 0.1 score per exposure
      
      let newStatus = current.status;
      // Status Logic:
      // > 5 score => mastered
      // > 1 score & 'new' => learning
      if (newScore > 5 && newStatus !== 'mastered') {
        newStatus = 'mastered';
      } else if (newScore > 1 && newStatus === 'new') {
        newStatus = 'learning';
      }

      await client.query(upsertQuery, [
        studentId,
        word,
        newExposures,
        newScore,
        newStatus
      ]);
    }

    await client.query('COMMIT');
    console.log(`[Flush] Successfully saved session data.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Flush] Database error:', err);
  } finally {
    client.release();
    // Clear memory
    activeSessions.delete(conversationId);
  }
};

app.post('/webhook', async (req, res) => {
  const event = req.body;
  
  console.log(`[Webhook] Received event: ${event.event_type}`);

  if (event.event_type === 'system.shutdown') {
    const { conversation_id } = event;
    console.log(`[Webhook] Session Ended for conversation: ${conversation_id}`);
    
    // Flush buffer to DB
    await flushSessionToDb(conversation_id);
  }

  res.json({ received: true });
});

app.post('/api/process-perception', (req, res) => {
  const { event_type, user_state, tool_name } = req.body;
  
  console.log(`[Perception] Processing event: ${event_type}, State: ${user_state}, Tool: ${tool_name}`);

  let isConfused = false;

  // 1. Check Tool Calls (Raven-0 style)
  if (tool_name === 'notify_if_user_confused') {
    isConfused = true;
  }

  // 2. Check Perception State (Raven-1/Legacy style)
  if (event_type === 'perception') {
    if (user_state === 'confused' || user_state === 'gaze_averting') {
      isConfused = true;
    }
  }

  if (isConfused) {
    return res.json({
      action: 'update_context',
      content: "[System Instruction: User looks confused. Rephrase the last point simply using basic vocabulary. Speak slowly. Do not switch to English.]"
    });
  }

  return res.json({ action: 'ignore' });
});

app.get('/health', (req, res) => {
  res.json('Healthy');
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
