const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. GET
app.get('/api/workouts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workouts ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database connection failed!' });
  }
});

// 2. POST
app.post('/api/workouts', async (req, res) => {
  try {
    const { workout_name, exercises } = req.body;
    const newWorkout = await pool.query(
      'INSERT INTO workouts (user_id, workout_name, exercises) VALUES (1, $1, $2) RETURNING *',
      [workout_name, exercises]
    );
    res.json(newWorkout.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error creating workout log' });
  }
});

// 3. DELETE
app.delete('/api/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM workouts WHERE id = $1', [id]);
    res.json({ message: 'Workout log deleted successfully!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error deleting workout log' });
  }
});

// 4. PUT
app.put('/api/profile', async (req, res) => {
  try {
    const { height, weight, goal } = req.body;
    const updatedUser = await pool.query(
      'UPDATE users SET height_cm = $1, weight_kg = $2, fitness_goal = $3 WHERE id = 1 RETURNING *',
      [height, weight, goal]
    );
    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// 5. GET
app.get('/api/profile', async (req, res) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = 1');
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// 6. PUT
app.put('/api/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { workout_name, exercises } = req.body;
    const updatedLog = await pool.query(
      'UPDATE workouts SET workout_name = $1, exercises = $2 WHERE id = $3 RETURNING *',
      [workout_name, exercises, id]
    );
    res.json(updatedLog.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error updating database log' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
