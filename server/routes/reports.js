const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');

// GET /api/reports/available-years
router.get('/available-years', async (req, res) => {
    try {
        const years = await reportService.getAvailableYears();
        res.json(years);
    } catch (err) {
        console.error('Error fetching available years:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET /api/reports/summary?year=2024
router.get('/summary', async (req, res) => {
    try {
        const { year } = req.query;
        if (!year) return res.status(400).json({ error: 'Year is required' });

        const summary = await reportService.getReportSummary(year);
        res.json(summary);
    } catch (err) {
        console.error('Error fetching report summary:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
