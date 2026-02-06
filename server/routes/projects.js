const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');

// DEBUG: List all project codes
router.get('/debug/list-all', async (req, res) => {
    try {
        const db = require('../db');
        const result = await db.query('SELECT project_code, project_name FROM projects');
        console.log('📋 All projects in DB:', result.rows);
        res.json({
            count: result.rows.length,
            projects: result.rows
        });
    } catch (err) {
        console.error('Debug error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/projects
// Retrieve all projects with their team members
router.get('/', async (req, res) => {
    try {
        const projects = await projectService.getAllProjects();
        res.json(projects);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET single project by code
router.get('/:project_code', async (req, res) => {
    try {
        const { project_code } = req.params;
        console.log(`📋 Fetching project: "${project_code}"`);

        const project = await projectService.getProjectByCode(project_code);
        console.log(`📋 Query result:`, project ? 'Found' : 'Not found');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (err) {
        console.error('Error fetching single project:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create a new project and assign team members
router.post('/', async (req, res) => {
    try {
        const result = await projectService.createProject(req.body);

        res.status(201).json({
            message: 'Project created successfully',
            project: result.project,
            team_count: result.team_count
        });

    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({
            error: 'Failed to create project',
            details: err.message,
            hint: err.hint,
            code: err.code,
            pg_detail: err.detail
        });
    }
});

// PUT /api/projects/:project_code
router.put('/:project_code', async (req, res) => {
    try {
        const { project_code } = req.params;
        const updatedProject = await projectService.updateProject(project_code, req.body);

        if (!updatedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(updatedProject);

    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/projects/:project_code
router.delete('/:project_code', async (req, res) => {
    try {
        const { project_code } = req.params;
        const success = await projectService.deleteProject(project_code);

        if (!success) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });

    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// POST /api/projects/:project_code/team
router.post('/:project_code/team', async (req, res) => {
    try {
        const { project_code } = req.params;
        const result = await projectService.addTeamMember(project_code, req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error adding team member:', err);
        res.status(500).json({ error: 'Failed to add team member' });
    }
});

// PUT /api/projects/:project_code/team/:member_id
router.put('/:project_code/team/:member_id', async (req, res) => {
    try {
        const { project_code, member_id } = req.params;
        const result = await projectService.updateTeamMember(project_code, member_id, req.body);
        res.json(result);
    } catch (err) {
        console.error('Error updating team member:', err);
        res.status(500).json({ error: 'Failed to update team member' });
    }
});

// DELETE /api/projects/:project_code/team/:member_id
router.delete('/:project_code/team/:member_id', async (req, res) => {
    try {
        const { project_code, member_id } = req.params;
        await projectService.removeTeamMember(project_code, member_id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing team member:', err);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
});

// DELETE /api/projects/dates/:date_id
// Delete a specific project date entry
router.delete('/dates/:date_id', async (req, res) => {
    try {
        const { date_id } = req.params;
        console.log(`🗑️ API Delete Request for Date ID: ${date_id}`);
        const id = parseInt(date_id); // Ensure integer

        if (isNaN(id)) {
            console.log('❌ Invalid ID format');
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const success = await projectService.deleteProjectDate(id);
        console.log(`🗑️ Delete result for ID ${id}: ${success ? 'Success' : 'Failed/Not Found'}`);

        if (!success) {
            return res.status(404).json({ error: 'Date entry not found' });
        }

        res.json({ message: 'Date deleted successfully' });
    } catch (err) {
        console.error('Error deleting project date:', err);
        res.status(500).json({ error: 'Failed to delete date' });
    }
});

module.exports = router;

