const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await dashboardService.getDashboardStats();
        res.json(stats);
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
