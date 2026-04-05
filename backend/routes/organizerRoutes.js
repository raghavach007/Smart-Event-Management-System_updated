
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// GET: Fetch events created by this specific organizer
router.get('/all-events', verifyToken, requireRole(['organizer']), async (req, res) => {
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

// --- ANNOUNCEMENT ROUTES ---

// POST: Create a new announcement for an event
router.post('/announce', verifyToken, requireRole(['organizer']), async (req, res) => {
  const { event_id, title, content } = req.body;

  if (!event_id || !title || !content) {
    return res.status(400).json({ message: 'Please provide event_id, title, and content.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO announcements (event_id, organizer_id, title, content) VALUES (?, ?, ?, ?)',
      [event_id, req.user.id, title, content]
    );
    res.status(201).json({ message: 'Announcement posted successfully!', announcementId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch announcements for a specific event (Organizer view)
router.get('/announcements/:eventId', verifyToken, requireRole(['organizer']), async (req, res) => {
  try {
    const [announcements] = await db.query(
      'SELECT * FROM announcements WHERE event_id = ? ORDER BY created_at DESC',
      [req.params.eventId]
    );
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CHECK-IN ROUTE ---

router.post('/checkin', verifyToken, requireRole(['organizer']), async (req, res) => {
  const { qr_token } = req.body;
  if (!qr_token) return res.status(400).json({ message: 'Please provide a ticket token.' });

  try {
    const query = `
      SELECT r.id, r.checked_in, e.title, u.name as student_name
      FROM Registrations r
      JOIN Events e ON r.event_id = e.id
      JOIN Users u ON r.student_id = u.id
      WHERE r.qr_token = ? AND e.created_by = ?
    `;
    const [tickets] = await db.query(query, [qr_token, req.user.id]);

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Invalid ticket or ticket does not belong to your events.' });
    }

    const ticket = tickets[0];
    if (ticket.checked_in) {
      return res.status(400).json({ message: `⚠️ Ticket already used! ${ticket.student_name} is already checked in.` });
    }

    await db.query('UPDATE Registrations SET checked_in = TRUE WHERE id = ?', [ticket.id]);
    res.json({ message: `✅ Success! ${ticket.student_name} checked into ${ticket.title}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;