const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');

// Minimal routes placeholder
router.get('/available-years', async (req, res) => {
    res.json([]);
});

router.get('/summary', async (req, res) => {
    res.json({});
});

module.exports = router;
