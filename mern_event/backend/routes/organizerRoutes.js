// File: backend/routes/organizerRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// GET: Fetch events created by this specific organizer
router.get('/events', verifyToken, requireRole(['organizer']), async (req, res) => {
  try {
    const [events] = await db.query('SELECT * FROM Events WHERE created_by = ? ORDER BY event_date DESC', [req.user.id]);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create a new event
router.post('/events', verifyToken, requireRole(['organizer']), async (req, res) => {
  const { title, description, event_date, capacity } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO Events (title, description, event_date, capacity, club_id, created_by, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [title, description, event_date, capacity, req.user.club_id, req.user.id]
    );
    res.status(201).json({ message: 'Event submitted for admin approval!', insertId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Verify and Check-In a student using their QR Token
router.post('/checkin', verifyToken, requireRole(['organizer']), async (req, res) => {
  const { qr_token } = req.body;

  if (!qr_token) {
    return res.status(400).json({ message: 'Please provide a ticket token.' });
  }

  try {
    // 1. Find the registration AND ensure the event belongs to this organizer
    const query = `
      SELECT r.id, r.checked_in, e.title, u.name as student_name
      FROM Registrations r
      JOIN Events e ON r.event_id = e.id
      JOIN Users u ON r.student_id = u.id
      WHERE r.qr_token = ? AND e.created_by = ?
    `;
    const [tickets] = await db.query(query, [qr_token, req.user.id]);

    // 2. Handle invalid tickets
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Invalid ticket or ticket does not belong to your events.' });
    }

    const ticket = tickets[0];

    // 3. Prevent double entry
    if (ticket.checked_in) {
      return res.status(400).json({ message: `⚠️ Ticket already used! ${ticket.student_name} is already checked in.` });
    }

    // 4. Update the database to checked in!
    await db.query('UPDATE Registrations SET checked_in = TRUE WHERE id = ?', [ticket.id]);

    res.json({ message: `✅ Success! ${ticket.student_name} checked into ${ticket.title}.` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;