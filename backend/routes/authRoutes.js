// File: backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { login, signup } = require('../controllers/authController');

router.post('/login', login);
router.post('/signup', signup); // The new signup endpoint

module.exports = router;