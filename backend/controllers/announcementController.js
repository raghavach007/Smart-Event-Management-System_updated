const db = require('../config/db');

// POST: Create a new announcement
const createAnnouncement = async (req, res) => {
    const { event_id, title, content } = req.body;
    
    // Derived from your verifyToken middleware
    const organizer_id = req.user.id; 

    if (!event_id || !title || !content) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const sql = "INSERT INTO announcements (event_id, organizer_id, title, content) VALUES (?, ?, ?, ?)";
        
        // Using await for cleaner execution
        const [result] = await db.query(sql, [event_id, organizer_id, title, content]);
        
        res.status(201).json({ 
            message: "Announcement posted successfully!",
            id: result.insertId 
        });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Failed to post announcement." });
    }
};

// GET: Fetch announcements for a specific event
const getAnnouncementsByEvent = async (req, res) => {
    const { eventId } = req.params;

    // Validation: ensure eventId exists in the request
    if (!eventId) {
        return res.status(400).json({ message: "Event ID is required." });
    }

    try {
        // We select everything but order by the latest timestamp
        const sql = `
            SELECT id, title, content, created_at 
            FROM announcements 
            WHERE event_id = ? 
            ORDER BY created_at DESC
        `;

        const [results] = await db.query(sql, [eventId]);

        res.status(200).json(results);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ error: "Could not fetch announcements." });
    }
};

module.exports = { createAnnouncement, getAnnouncementsByEvent };