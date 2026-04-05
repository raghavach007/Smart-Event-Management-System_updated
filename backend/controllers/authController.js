// File: backend/controllers/authController.js

const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = users[0];
    const isMatch = (password === user.password_hash) || await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, club_id: user.club_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, club_id: user.club_id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// NEW: The Signup Function
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if the email is already taken
    const [existingUsers] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // 2. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert the new user into the database (Defaulting to 'student' role)
    const [result] = await db.query(
      'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'student']
    );

    // 4. Automatically log them in by generating a token
    const token = jwt.sign(
      { id: result.insertId, role: 'student', club_id: null },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 5. Send it back to the frontend
    res.status(201).json({
      token,
      user: { id: result.insertId, name, email, role: 'student', club_id: null }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

module.exports = { login, signup };