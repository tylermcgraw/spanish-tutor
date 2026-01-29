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
  const { student_id, word, exposures, score, status } = req.body;
  try {
    const upsertQuery = `
      INSERT INTO vocabulary (student_id, word, exposures, score, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (student_id, word)
      DO UPDATE SET exposures = $3, score = $4, status = $5;
    `;
    await db.query(upsertQuery, [student_id, word, exposures, score, status]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/conversation', async (req, res) => {
  try {
    const { student_id } = req.body;

    const { rows } = await db.query('SELECT word, status FROM vocabulary WHERE student_id = $1', [student_id]);
    const vocabContext = rows.length > 0 
      ? rows.map(r => `${r.word} (${r.status})`).join(', ')
      : "No prior vocabulary.";

    const response = await axios.post(TAVUS_API_URL, {
      persona_id: PERSONA_ID || req.body.persona_id,
      conversation_name: `Spanish Lesson for ${student_id}`,
      conversational_context: `Student's Vocabulary Context: ${vocabContext}`,
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
