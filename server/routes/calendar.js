const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');

// GET /api/calendar/events
// Optional query param: ?month=2026-01
router.get('/events', async (req, res) => {
    try {
        const { month } = req.query;
        const events = await projectService.getAllProjectDatesForCalendar(month);
        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
