const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// 1. FETCH TICKETS (The route causing the 500 error)
router.get('/tickets', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT r.qr_token, r.checked_in, r.registration_time, r.is_leader, r.team_id,
             e.id as event_id, e.title, e.description, e.event_date,
             t.name as team_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN teams t ON r.team_id = t.id
      WHERE r.student_id = ?
      ORDER BY e.event_date ASC
    `;
    const [tickets] = await db.query(query, [req.user.id]);
    res.json(tickets);
  } catch (err) {
    console.error("CRITICAL DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Backend Column Mismatch. Check SQL Migration." });
  }
});

// 2. FETCH INTEL FEED
router.get('/team-requests', verifyToken, async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT tr.id, t.name as team_name, e.title as event_title, u.name as sender_name
      FROM team_requests tr
      JOIN teams t ON tr.team_id = t.id
      JOIN events e ON t.event_id = e.id
      JOIN users u ON tr.sender_id = u.id
      WHERE tr.receiver_id = ? AND tr.status = 'pending'
    `, [req.user.id]);
    res.json(requests);
  } catch (err) {
    res.status(200).json([]); // Fallback to empty array to prevent UI crash
  }
});

// 3. REGISTER (Solo or Team)
router.post('/events/:id/register', verifyToken, async (req, res) => {
  const eventId = req.params.id;
  const studentId = req.user.id;
  const { teamName } = req.body;
  const qrToken = crypto.randomBytes(16).toString('hex');

  try {
    await db.query('START TRANSACTION');
    let teamId = null;

    if (teamName) {
      const [teamResult] = await db.query(
        'INSERT INTO teams (name, event_id, leader_id) VALUES (?, ?, ?)',
        [teamName, eventId, studentId]
      );
      teamId = teamResult.insertId;
    }

    await db.query(
      'INSERT INTO registrations (student_id, event_id, qr_token, team_id, is_leader, checked_in) VALUES (?, ?, ?, ?, ?, 0)',
      [studentId, eventId, qrToken, teamId, teamName ? 1 : 0]
    );

    await db.query('COMMIT');
    res.status(201).json({ message: "Experience Secured!" });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;