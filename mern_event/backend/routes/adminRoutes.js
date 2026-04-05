const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');

/**
 * 1. EXPERIENCE MANIFEST
 * Allows Admin and Organizers to see participant lists and team structures.
 */
router.get('/events/:id/manifest', verifyToken, requireRole(['admin', 'organizer']), async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // If user is an organizer, verify they own the event
    if (userRole === 'organizer') {
      const [[eventCheck]] = await db.query(
        'SELECT e.id FROM events e JOIN users u ON e.club_id = u.club_id WHERE e.id = ? AND u.id = ?',
        [eventId, userId]
      );
      if (!eventCheck) return res.status(403).json({ error: "Access denied to this event manifest." });
    }

    const [[event]] = await db.query('SELECT title FROM events WHERE id = ?', [eventId]);
    if (!event) return res.status(404).json({ error: "Event not found." });
    
    const [participants] = await db.query(`
      SELECT u.name, u.email, t.name as team_name, r.checked_in, r.registration_time
      FROM registrations r
      JOIN users u ON r.student_id = u.id
      LEFT JOIN teams t ON r.team_id = t.id
      WHERE r.event_id = ?
      ORDER BY t.name DESC, u.name ASC
    `, [eventId]);

    res.json({ eventTitle: event.title, participants });
  } catch (err) { 
    console.error("MANIFEST ERROR:", err.message);
    res.status(500).json({ error: "Manifest retrieval failed." }); 
  }
});

/**
 * 2. OVERSIGHT QUEUE
 * Fetch all events, prioritized by 'pending' status for Admin review.
 */
router.get('/events', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const query = `
      SELECT e.*, c.name as club_name 
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      ORDER BY FIELD(status, 'pending', 'approved', 'rejected'), e.created_at DESC
    `;
    const [events] = await db.query(query);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. STATUS UPDATER
 * Admin approval/rejection toggle.
 */
router.put('/events/:id/status', verifyToken, requireRole(['admin']), async (req, res) => {
  const { status } = req.body;
  const eventId = req.params.id;
  try {
    await db.query("UPDATE events SET status = ? WHERE id = ?", [status, eventId]);
    res.json({ message: `Event ${status} successfully!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. DEFENSIVE ANALYTICS
 * Real-time stats for the Admin dashboard.
 */
router.get('/analytics', verifyToken, requireRole(['admin']), async (req, res) => {
  let stats = { students: 0, events: 0, attendance: 0 };
  try {
    const [[sRes]] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [[eRes]] = await db.query("SELECT COUNT(*) as count FROM events WHERE status = 'approved'");
    const [[aRes]] = await db.query("SELECT COUNT(*) as count FROM registrations WHERE checked_in = 1");

    stats.students = sRes?.count || 0;
    stats.events = eRes?.count || 0;
    stats.attendance = aRes?.count || 0;

    const [participation] = await db.query(`
      SELECT u.name as student, e.title as event, r.checked_in, r.registration_time as timestamp 
      FROM registrations r 
      LEFT JOIN users u ON r.student_id = u.id 
      LEFT JOIN events e ON r.event_id = e.id 
      ORDER BY r.registration_time DESC LIMIT 10
    `);

    res.json({ stats, participation: participation || [] });
  } catch (err) { 
    res.status(200).json({ stats, participation: [] }); 
  }
});

/**
 * 5. ATOMIC CLUB FORGE
 * Creates a club and its organizer in a single transaction.
 */
router.post('/clubs', verifyToken, requireRole(['admin']), async (req, res) => {
  const { name, description, organizerName, organizerEmail, organizerPassword } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [clubResult] = await connection.query(
      "INSERT INTO clubs (name, description) VALUES (?, ?)", 
      [name, description]
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(organizerPassword, salt);

    await connection.query(
      "INSERT INTO users (name, email, password_hash, role, club_id) VALUES (?, ?, ?, ?, ?)",
      [organizerName, organizerEmail, hashedPassword, 'organizer', clubResult.insertId]
    );

    await connection.commit();
    res.status(201).json({ message: 'Organization forged and Organizer account secured!' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally { 
    connection.release(); 
  }
});

/**
 * 6. CLUB FETCHER
 */
router.get('/clubs', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const [clubs] = await db.query("SELECT * FROM clubs");
    res.json(clubs);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;