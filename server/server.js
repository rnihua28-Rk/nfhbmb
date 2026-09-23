const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error("Database connection failed:", err.message);
  else console.log("Connected to SQLite database.");
});

// Create Tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    department TEXT,
    year TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER,
    status TEXT,
    date TEXT,
    hour INTEGER
  )`);
});

// --- API ROUTES ---

// 1. Get all users
app.get('/api/users', (req, res) => {
  db.all("SELECT id, name, username, role, department, year FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. Add / Register user
app.post('/api/users', (req, res) => {
  const { name, username, password, role, department, year } = req.body;
  const query = `INSERT INTO users (name, username, password, role, department, year) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(query, [name, username, password, role, department || null, year || null], function(err) {
    if (err) {
      return res.status(400).json({ error: "Username already exists or invalid data" });
    }
    res.status(201).json({ id: this.lastID, name, username, role, department, year });
  });
});

// 3. Login
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  const query = `SELECT id, name, username, role, department, year FROM users WHERE username = ? AND password = ? AND role = ?`;
  db.get(query, [username, password, role], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: "Invalid credentials or role" });
    res.json(row);
  });
});

// 4. Delete user
app.delete('/api/users/:id', (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run("DELETE FROM attendance WHERE studentId = ?", [id]);
    res.json({ message: "Deleted successfully" });
  });
});

// 5. Get attendance records
app.get('/api/attendance', (req, res) => {
  db.all("SELECT * FROM attendance", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 6. Mark attendance
app.post('/api/attendance', (req, res) => {
  const { studentId, status, date, hour } = req.body;
  const query = `INSERT INTO attendance (studentId, status, date, hour) VALUES (?, ?, ?, ?)`;
  db.run(query, [studentId, status, date, hour], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, studentId, status, date, hour });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});