const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- helpers ----------
const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (local time)

function validate(body) {
  const errors = [];
  const { name, phone, doctor, date, time } = body;
  if (!name || name.trim().length < 2) errors.push("Name must be at least 2 characters.");
  if (!/^\d{10}$/.test(phone || "")) errors.push("Phone must be exactly 10 digits.");
  if (!doctor || !doctor.trim()) errors.push("Doctor is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) errors.push("Date must be YYYY-MM-DD.");
  else if (date < todayStr()) errors.push("Date cannot be in the past.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time || "")) errors.push("Time must be HH:MM (24h).");
  return errors;
}

const slotTaken = (doctor, date, time, ignoreId = 0) =>
  db
    .prepare(
      `SELECT id FROM appointments
       WHERE doctor = ? AND date = ? AND time = ? AND status = 'booked' AND id != ?`
    )
    .get(doctor, date, time, ignoreId);

const selectOne = db.prepare(`
  SELECT a.id, p.name, p.phone, a.doctor, a.date, a.time, a.reason, a.status
  FROM appointments a JOIN patients p ON p.id = a.patient_id
  WHERE a.id = ?`);

// ---------- routes ----------

// GET all appointments (soonest first)
app.get("/api/appointments", (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.id, p.name, p.phone, a.doctor, a.date, a.time, a.reason, a.status
       FROM appointments a JOIN patients p ON p.id = a.patient_id
       ORDER BY a.date, a.time`
    )
    .all();
  res.json(rows);
});

// POST create an appointment
app.post("/api/appointments", (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const name = req.body.name.trim();
  const phone = req.body.phone;
  const doctor = req.body.doctor.trim();
  const { date, time } = req.body;
  const reason = (req.body.reason || "").trim();

  if (slotTaken(doctor, date, time))
    return res.status(409).json({ errors: ["That doctor is already booked at this date and time."] });

  // find the patient by phone, or create a new one
  let patient = db.prepare("SELECT id FROM patients WHERE phone = ?").get(phone);
  if (patient) {
    db.prepare("UPDATE patients SET name = ? WHERE id = ?").run(name, patient.id);
  } else {
    const info = db.prepare("INSERT INTO patients (name, phone) VALUES (?, ?)").run(name, phone);
    patient = { id: info.lastInsertRowid };
  }

  const info = db
    .prepare("INSERT INTO appointments (patient_id, doctor, date, time, reason) VALUES (?, ?, ?, ?, ?)")
    .run(patient.id, doctor, date, time, reason);

  res.status(201).json(selectOne.get(info.lastInsertRowid));
});

// PUT update an appointment
app.put("/api/appointments/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ errors: ["Appointment not found."] });
  if (existing.status === "cancelled")
    return res.status(400).json({ errors: ["Cancelled appointments cannot be edited."] });

  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const doctor = req.body.doctor.trim();
  const { date, time } = req.body;
  if (slotTaken(doctor, date, time, id))
    return res.status(409).json({ errors: ["That doctor is already booked at this date and time."] });

  db.prepare("UPDATE patients SET name = ?, phone = ? WHERE id = ?").run(
    req.body.name.trim(),
    req.body.phone,
    existing.patient_id
  );
  db.prepare("UPDATE appointments SET doctor = ?, date = ?, time = ?, reason = ? WHERE id = ?").run(
    doctor,
    date,
    time,
    (req.body.reason || "").trim(),
    id
  );
  res.json(selectOne.get(id));
});

// DELETE = cancel (keeps history, frees the slot)
app.delete("/api/appointments/:id", (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(id);
  if (info.changes === 0) return res.status(404).json({ errors: ["Appointment not found."] });
  res.json(selectOne.get(id));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
