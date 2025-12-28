const db = require('../db');

// GET all projects
const getAllProjects = async () => {
    const result = await db.query(`
        SELECT
            p.*,
            (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE project_code = p.project_code) as total_income,
            (SELECT COALESCE(SUM(net_amount), 0) FROM expenses WHERE project_code = p.project_code) as total_expense,
            (
                SELECT json_agg(json_build_object(
                    'id', pt.id,
                    'member_id', pt.member_id,
                    'role', pt.role,
                    'member_name', tm.name,
                    'member_nickname', tm.nickname
                ))
                FROM project_team pt
                JOIN team_members tm ON pt.member_id = tm.id
                WHERE pt.project_code = p.project_code
            ) as team_members
        FROM projects p
        ORDER BY p.created_at DESC
    `);
    return result.rows;
};

// GET single project by code
const getProjectByCode = async (projectCode) => {
    const projectResult = await db.query('SELECT * FROM projects WHERE project_code = $1', [projectCode]);

    if (projectResult.rows.length === 0) {
        return null;
    }

    const project = projectResult.rows[0];

    // Fetch team members for the project
    const teamMembersResult = await db.query(`
            SELECT pt.id, pt.member_id, pt.role, tm.name, tm.nickname, tm.email, tm.phone, tm.tax_id
            FROM project_team pt
            JOIN team_members tm ON pt.member_id = tm.id
            WHERE pt.project_code = $1
    `, [projectCode]);

    project.team_members = teamMembersResult.rows;
    return project;
};

// CREATE new project
const createProject = async (projectData) => {
    const {
        project_code, project_name, product_code, customer_name, status,
        project_type, start_date, end_date, location, description,
        budget, participant_count, created_by, team_members
    } = projectData;

    // Sanitize string fields - remove leading/trailing whitespace
    const cleanProjectCode = project_code?.trim();
    const cleanProjectName = project_name?.trim();
    const cleanCustomerName = customer_name?.trim();

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Fetch a valid user ID if created_by is missing/invalid
        let creatorId = created_by;
        if (!creatorId) {
            const userRes = await client.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
            if (userRes.rows.length > 0) {
                creatorId = userRes.rows[0].id;
            } else {
                throw new Error("No users found in database to assign as creator");
            }
        }

        const projectQuery = `
            INSERT INTO projects(
                project_code, project_name, product_code, customer_name, status,
                project_type, start_date, end_date, location, description,
                budget, participant_count, created_by
            )
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const projectValues = [
            cleanProjectCode, cleanProjectName, product_code, cleanCustomerName, status || 'Pending',
            project_type, start_date, end_date, location, description,
            budget, participant_count, creatorId
        ];

        const projectResult = await client.query(projectQuery, projectValues);
        const newProject = projectResult.rows[0];

        // Insert Team Members (if any)
        if (team_members && team_members.length > 0) {
            for (const member of team_members) {
                const teamQuery = `
                    INSERT INTO project_team(project_code, member_id, role)
                    VALUES($1, $2, $3)
                `;
                await client.query(teamQuery, [
                    newProject.project_code,
                    member.member_id,
                    member.role
                ]);
            }
        }

        await client.query('COMMIT');

        // Return structured result
        return {
            project: newProject,
            team_count: team_members ? team_members.length : 0
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// UPDATE project
const updateProject = async (projectCode, updateData) => {
    const {
        project_name, product_code, customer_name, status,
        project_type, start_date, end_date, location,
        description, budget, participant_count
    } = updateData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE projects
            SET 
                project_name = COALESCE($2, project_name),
                product_code = COALESCE($3, product_code),
                customer_name = COALESCE($4, customer_name),
                status = COALESCE($5, status),
                project_type = COALESCE($6, project_type),
                start_date = COALESCE($7, start_date),
                end_date = COALESCE($8, end_date),
                location = COALESCE($9, location),
                description = COALESCE($10, description),
                budget = COALESCE($11, budget),
                participant_count = COALESCE($12, participant_count),
                updated_at = NOW()
            WHERE project_code = $1
            RETURNING *
        `;

        const values = [
            projectCode, project_name, product_code, customer_name, status,
            project_type, start_date, end_date, location, description,
            budget, participant_count
        ];

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        await client.query('COMMIT');
        return result.rows[0];

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const addTeamMember = async (projectCode, memberData) => {
    const { member_id, role } = memberData;
    const result = await db.query(
        `INSERT INTO project_team(project_code, member_id, role)
         VALUES($1, $2, $3)
         RETURNING *`,
        [projectCode, member_id, role]
    );
    return result.rows[0];
};

const updateTeamMember = async (projectCode, memberId, updateData) => {
    const { role } = updateData;
    const result = await db.query(
        `UPDATE project_team
         SET role = COALESCE($3, role)
         WHERE project_code = $1 AND member_id = $2
         RETURNING *`,
        [projectCode, memberId, role]
    );
    return result.rows[0];
};

const removeTeamMember = async (projectCode, memberId) => {
    await db.query(
        'DELETE FROM project_team WHERE project_code = $1 AND member_id = $2',
        [projectCode, memberId]
    );
    return { success: true };
};

// DELETE project
const deleteProject = async (projectCode) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Delete related data first (FK constraints)
        // Note: Depending on cascade settings, this might be auto-handled.
        // Assuming manual cleanup for safety or if cascade is missing.
        await client.query('DELETE FROM project_team WHERE project_code = $1', [projectCode]);
        await client.query('DELETE FROM incomes WHERE project_code = $1', [projectCode]);
        await client.query('DELETE FROM expenses WHERE project_code = $1', [projectCode]);

        const result = await client.query('DELETE FROM projects WHERE project_code = $1', [projectCode]);

        await client.query('COMMIT');

        if (result.rowCount === 0) {
            return false;
        }
        return true;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    getAllProjects,
    getProjectByCode,
    createProject,
    updateProject,
    deleteProject,
    addTeamMember,
    updateTeamMember,
    removeTeamMember
};
