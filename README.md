# Clinic Appointment Tracker

A full-stack web app to book, view, edit and cancel clinic appointments.

**Tech stack:** React (Vite), Node.js, Express, SQLite (SQL), REST APIs, Git/GitHub

## Features
- Book appointments with validation (name, 10-digit phone, doctor, future date, time)
- Prevents double-booking of the same doctor at the same date and time (409 error)
- Edit and cancel appointments; cancelled ones stay in history and free the slot
- Filter appointments by status
- Normalised SQL schema: `patients` and `appointments` tables linked by a foreign key

## REST API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/appointments | List all appointments |
| POST | /api/appointments | Create an appointment |
| PUT | /api/appointments/:id | Update an appointment |
| DELETE | /api/appointments/:id | Cancel an appointment |

## Run locally
Requires Node.js 18+.

```bash
# terminal 1 - API
cd server
npm install
npm start          # http://localhost:3001

# terminal 2 - frontend
cd client
npm install
npm run dev        # http://localhost:5173
```

## Project structure
```
server/  db.js (schema), index.js (routes + validation)
client/  src/App.jsx (UI), src/api.js (API calls)
```
