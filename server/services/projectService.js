const db = require('../db');

// GET all projects
const getAllProjects = async () => {
    // We join with project_types and products to get readable names
    // We aggregate project_dates to get start/end range
    const result = await db.query(`
        SELECT
            p.*,
            pt.name as project_type_name,
            pt.label as project_type_label,
            pd.product_name,
            -- UI often expects a single display name. 
            -- Priority: product_name (if linked) > project_name > project_code
            COALESCE(pd.product_name, p.project_name, p.project_code) as display_name,
            (SELECT COALESCE(SUM(amount), 0) FROM income_lists WHERE project_code = p.project_code) as total_income,
            (
                SELECT COALESCE(SUM(net_amount), 0) 
                FROM expense_lists 
                WHERE project_code = p.project_code 
                AND internal_status != 'Rejected'
            ) as total_expense,
            (
                SELECT MIN(start_date) FROM project_dates WHERE project_code = p.project_code
            ) as derived_start_date,
            (
                SELECT MAX(end_date) FROM project_dates WHERE project_code = p.project_code
            ) as derived_end_date
        FROM projects p
        LEFT JOIN project_types pt ON p.project_type_id = pt.id
        LEFT JOIN products pd ON p.product_code = pd.product_code
        ORDER BY p.created_at DESC
    `);
    return result.rows;
};

// GET single project by code
const getProjectByCode = async (projectCode) => {
    const projectQuery = `
        SELECT 
            p.*, 
            pt.name as project_type_name,
            pt.label as project_type_label,
            pd.product_name,
            COALESCE(pd.product_name, p.project_name, p.project_code) as display_name
        FROM projects p
        LEFT JOIN project_types pt ON p.project_type_id = pt.id
        LEFT JOIN products pd ON p.product_code = pd.product_code
        WHERE p.project_code = $1
    `;
    const projectResult = await db.query(projectQuery, [projectCode]);

    if (projectResult.rows.length === 0) {
        return null;
    }

    const project = projectResult.rows[0];

    // Fetch dates
    const datesResult = await db.query(`
        SELECT * FROM project_dates 
        WHERE project_code = $1 
        ORDER BY start_date ASC
    `, [projectCode]);

    project.dates = datesResult.rows;

    // Derived convenience fields for UI
    if (project.dates.length > 0) {
        project.start_date = project.dates[0].start_date;
        project.end_date = project.dates[project.dates.length - 1].end_date || project.dates[project.dates.length - 1].start_date;
    }

    return project;
};

// Helper: Get Project Type ID from Name/Value
const getProjectTypeId = async (client, typeNameOrId) => {
    if (!isNaN(typeNameOrId)) return parseInt(typeNameOrId); // Already an ID

    // Try exact match on name
    const res = await client.query('SELECT id FROM project_types WHERE name = $1 OR label = $1', [typeNameOrId]);
    if (res.rows.length > 0) return res.rows[0].id;

    // Fallback: Default to 'Other' or first available
    const fallback = await client.query("SELECT id FROM project_types WHERE name = 'Other'");
    return fallback.rows[0]?.id || null;
};

// CREATE new project
const createProject = async (projectData) => {
    const {
        project_code, project_name, project_type, product_code, customer_name,
        participant_count, budget, description, status,
        created_by, dates // Array of objects { start_date, end_date, location, description }
    } = projectData;

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Resolve Project Type ID
        const projectTypeId = await getProjectTypeId(client, project_type);

        // Resolve User ID (Default to 1 'admin' if missing)
        let creatorId = created_by;
        if (!creatorId) {
            // For now, use the seeded admin
            creatorId = 1;
        }

        const projectQuery = `
            INSERT INTO projects(
                project_code, project_name, project_type_id, product_code, customer_name, 
                participant_count, budget, description, status, created_by, updated_by
            )
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
            RETURNING *
        `;

        const projectValues = [
            project_code, project_name, projectTypeId, product_code || null, customer_name,
            participant_count || 0, budget || 0, description, status || 'Active', creatorId
        ];

        const projectResult = await client.query(projectQuery, projectValues);
        const newProject = projectResult.rows[0];

        // Insert Dates
        if (dates && Array.isArray(dates) && dates.length > 0) {
            for (const dateObj of dates) {
                await client.query(`
                    INSERT INTO project_dates(project_code, date_name, start_date, end_date, location, description, created_by, updated_by)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $7)
                `, [
                    newProject.project_code,
                    dateObj.date_name || '', // Title
                    dateObj.start_date,
                    dateObj.end_date || dateObj.start_date,
                    dateObj.location,
                    dateObj.description,
                    creatorId
                ]);
            }
        } else if (projectData.start_date) {
            // Legacy/Fallback: If single start_date provided instead of dates array
            await client.query(`
                INSERT INTO project_dates(project_code, date_name, start_date, end_date, location, description, created_by, updated_by)
                VALUES($1, $2, $3, $4, $5, $6, $7, $7)
            `, [
                newProject.project_code,
                'Day 1', // Default title for legacy
                projectData.start_date,
                projectData.end_date || projectData.start_date,
                projectData.location,
                description, // use main desc as note
                creatorId
            ]);
        }

        await client.query('COMMIT');
        return newProject;

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
        project_name, project_type, product_code, customer_name,
        participant_count, budget, description, status,
        updated_by, dates // Array of objects
    } = updateData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Resolve Type ID if provided
        let projectTypeId = undefined;
        if (project_type) {
            projectTypeId = await getProjectTypeId(client, project_type);
        }

        const updaterId = updated_by || 1; // Default admin

        // Construct dynamic update query
        const fields = [];
        const values = [projectCode];
        let paramIndex = 2;

        if (project_name !== undefined) { fields.push(`project_name = $${paramIndex++}`); values.push(project_name); }
        if (projectTypeId !== undefined) { fields.push(`project_type_id = $${paramIndex++}`); values.push(projectTypeId); }
        if (product_code !== undefined) { fields.push(`product_code = $${paramIndex++}`); values.push(product_code); }
        if (customer_name !== undefined) { fields.push(`customer_name = $${paramIndex++}`); values.push(customer_name); }
        if (participant_count !== undefined) { fields.push(`participant_count = $${paramIndex++}`); values.push(participant_count); }
        if (budget !== undefined) { fields.push(`budget = $${paramIndex++}`); values.push(budget); }
        if (description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(description); }
        if (status !== undefined) { fields.push(`status = $${paramIndex++}`); values.push(status); }

        // Always update timestamp and updater
        fields.push(`updated_at = NOW()`);
        fields.push(`updated_by = $${paramIndex++}`);
        values.push(updaterId);

        if (fields.length > 2) { // Meaning we have at least one field + metadata to update
            const updateQuery = `UPDATE projects SET ${fields.join(', ')} WHERE project_code = $1 RETURNING *`;
            await client.query(updateQuery, values);
        } else {
            // Even if no fields, we might just be updating dates, so verify project exists
            const check = await client.query('SELECT 1 FROM projects WHERE project_code = $1', [projectCode]);
            if (check.rows.length === 0) throw new Error("Project not found");
        }

        // Update Dates (Full Replace)
        if (dates && Array.isArray(dates)) {
            // Delete old dates
            await client.query('DELETE FROM project_dates WHERE project_code = $1', [projectCode]);

            // Insert new dates
            for (const dateObj of dates) {
                await client.query(`
                    INSERT INTO project_dates(project_code, date_name, start_date, end_date, location, description, created_by, updated_by)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $7)
                `, [
                    projectCode,
                    dateObj.date_name || '', // Title
                    dateObj.start_date,
                    dateObj.end_date || dateObj.start_date,
                    dateObj.location,
                    dateObj.description,
                    updaterId
                ]);
            }
        }

        await client.query('COMMIT');
        return await getProjectByCode(projectCode); // Return full object with dates

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// DELETE project
const deleteProject = async (projectCode) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Cascade delete should handle children, but mostly we want to be explicit
        // project_dates, expense_lists, income_lists REFERENCES projects

        // Note: Our schema defined `ON DELETE CASCADE` for valid FKs? 
        // schema_new.sql: 
        // project_dates -> ON DELETE CASCADE
        // expense_lists -> NO CASCADE (default restrict/no action usually, or just missing).
        // Let's manually delete children to be safe.

        await client.query('DELETE FROM project_dates WHERE project_code = $1', [projectCode]);
        await client.query('DELETE FROM income_lists WHERE project_code = $1', [projectCode]);
        await client.query('DELETE FROM expense_lists WHERE project_code = $1', [projectCode]);

        const result = await client.query('DELETE FROM projects WHERE project_code = $1', [projectCode]);

        await client.query('COMMIT');
        return result.rowCount > 0;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// GET all project dates for calendar view
const getAllProjectDatesForCalendar = async (month = null) => {
    let query = `
        SELECT 
            pd.id,
            pd.project_code,
            pd.start_date,
            pd.end_date,
            pd.location,
            pd.description as date_description,
            p.project_name,
            p.status as project_status,
            pt.name as project_type,
            pt.label as project_type_label,
            COALESCE(pr.product_name, p.project_name, p.project_code) as display_name
        FROM project_dates pd
        JOIN projects p ON pd.project_code = p.project_code
        LEFT JOIN project_types pt ON p.project_type_id = pt.id
        LEFT JOIN products pr ON p.product_code = pr.product_code
    `;

    const params = [];

    // Optional month filter (format: YYYY-MM)
    if (month) {
        const [year, monthNum] = month.split('-');
        const startOfMonth = `${year}-${monthNum}-01`;
        const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];

        query += ` WHERE (
            (pd.start_date >= $1 AND pd.start_date <= $2)
            OR (pd.end_date >= $1 AND pd.end_date <= $2)
            OR (pd.start_date <= $1 AND pd.end_date >= $2)
        )`;
        params.push(startOfMonth, endOfMonth);
    }

    query += ` ORDER BY pd.start_date ASC`;

    const result = await db.query(query, params);
    return result.rows;
};

// DELETE a project date entry
const deleteProjectDate = async (dateId) => {
    console.log(`[Service] Deleting project date ID: ${dateId}`);
    const result = await db.query('DELETE FROM project_dates WHERE id = $1 RETURNING *', [dateId]);
    console.log(`[Service] Deleted count: ${result.rowCount}`);
    return result.rowCount > 0;
};

module.exports = {
    getAllProjects,
    getProjectByCode,
    createProject,
    updateProject,
    deleteProject,
    getAllProjectDatesForCalendar,
    deleteProjectDate
};
