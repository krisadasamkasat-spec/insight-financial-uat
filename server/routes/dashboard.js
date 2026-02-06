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

// GET /api/dashboard/cashflow-yearly
router.get('/cashflow-yearly', async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const data = await dashboardService.getYearlyCashflow(year);
        res.json(data);
    } catch (err) {
        console.error('Error fetching yearly cashflow:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
