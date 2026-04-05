const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const { getAnnouncementsByEvent } = require('../controllers/announcementController');
const crypto = require('crypto');

// 1. FETCH TICKETS (Wallet)
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
    res.status(500).json({ error: "Backend Column Mismatch." });
  }
});

// 2. FETCH INTEL FEED (Team Invitations)
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
    res.status(200).json([]);
  }
});

// 3. FETCH ALL ANNOUNCEMENTS (For the Student Hub Feed)
router.get('/announcements/all', verifyToken, async (req, res) => {
    const studentId = req.user.id; 
    try {
        // FIXED: Removed 'anarchy' and added proper SELECT columns
        const [rows] = await db.execute(`
            SELECT a.id, a.title, a.content, a.created_at, e.title as event_name
            FROM announcements a
            JOIN events e ON a.event_id = e.id
            JOIN registrations r ON a.event_id = r.event_id
            WHERE r.student_id = ?
            ORDER BY a.created_at DESC`, [studentId]);
            
        res.json(rows);
    } catch (err) {
        console.error("Announcements Error:", err.message);
        res.status(500).json({ message: "Error fetching announcements" });
    }
});

// 4. FETCH ANNOUNCEMENTS FOR SPECIFIC EVENT
router.get('/announcements/:eventId', verifyToken, getAnnouncementsByEvent);

// 5. REGISTER (Solo or Team)
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