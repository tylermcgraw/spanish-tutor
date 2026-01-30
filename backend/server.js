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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
