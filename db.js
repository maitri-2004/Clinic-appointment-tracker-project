// SQLite database setup: two tables (patients, appointments)
const Database = require("better-sqlite3");

const db = new Database("clinic.db");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    doctor     TEXT NOT NULL,
    date       TEXT NOT NULL,   -- YYYY-MM-DD
    time       TEXT NOT NULL,   -- HH:MM
    reason     TEXT,
    status     TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','cancelled'))
  );

  -- Database-level guard: one active booking per doctor/date/time
  CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_slot
    ON appointments(doctor, date, time) WHERE status = 'booked';
`);

module.exports = db;
