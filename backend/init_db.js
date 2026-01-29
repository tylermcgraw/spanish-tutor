const { pool } = require('./db');

const initDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS vocabulary (
      student_id VARCHAR(255),
      word VARCHAR(255),
      exposures INT DEFAULT 0,
      score FLOAT DEFAULT 0.0,
      status VARCHAR(50) DEFAULT 'new',
      PRIMARY KEY (student_id, word)
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('Table "vocabulary" ensured.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await pool.end();
  }
};

initDb();
