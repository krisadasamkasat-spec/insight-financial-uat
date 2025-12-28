const express = require('express');
const router = express.Router();
const memberService = require('../services/memberService');

// GET /api/members
router.get('/', async (req, res) => {
    try {
        const members = await memberService.getAllMembers();
        res.json(members);
    } catch (err) {
        console.error('Error fetching members:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/members
router.post('/', async (req, res) => {
    try {
        const newMember = await memberService.createMember(req.body);
        res.status(201).json(newMember);
    } catch (err) {
        console.error('Error creating member:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/members/:id
router.put('/:id', async (req, res) => {
    try {
        const updatedMember = await memberService.updateMember(req.params.id, req.body);
        if (!updatedMember) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json(updatedMember);
    } catch (err) {
        console.error('Error updating member:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/members/:id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await memberService.deleteMember(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json({ message: 'Member deleted successfully' });
    } catch (err) {
        console.error('Error deleting member:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
