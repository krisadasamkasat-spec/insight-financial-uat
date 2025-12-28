const express = require('express');
const router = express.Router();
const commonService = require('../services/commonService');

// GET /api/common/roles
router.get('/roles', async (req, res) => {
    try {
        const roles = await commonService.getAllRoles();
        res.json(roles);
    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/common/project-types
router.get('/project-types', async (req, res) => {
    try {
        const types = await commonService.getAllProjectTypes();
        res.json(types);
    } catch (err) {
        console.error('Error fetching project types:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/common/financial-statuses?category=income|expense
router.get('/financial-statuses', async (req, res) => {
    try {
        const { category } = req.query;
        const statuses = await commonService.getFinancialStatuses(category);
        res.json(statuses);
    } catch (err) {
        console.error('Error fetching financial statuses:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
