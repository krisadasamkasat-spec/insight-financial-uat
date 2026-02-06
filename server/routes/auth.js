const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const authenticateToken = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        const { user, token } = await authService.login(username, password);
        res.json({ user, token });
    } catch (err) {
        console.error(err.message);
        if (err.message === 'User not found' || err.message === 'Invalid credentials') {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // req.user is set by middleware
        res.json(req.user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
