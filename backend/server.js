// File: backend/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const studentRoutes = require('./routes/studentRoutes');
const db = require('./config/db');
const { verifyToken, requireRole } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes'); // IMPORT YOUR NEW ROUTES

const organizerRoutes = require('./routes/organizerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();
app.use(cors()); 
app.use(express.json()); 

// Register Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
// Test Routes (Keep these for now)
app.get('/api/status', (req, res) => res.json({ message: 'Server is running.' }));
app.get('/api/events', async (req, res) => {
  const [rows] = await db.query("SELECT * FROM Events WHERE status = 'approved'");
  res.json(rows);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));