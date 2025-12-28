const db = require('./server/db');

async function checkProject() {
    try {
        console.log("Checking for project INHOUSE00003...");
        const res = await db.query("SELECT * FROM projects WHERE project_code = 'INHOUSE00003'");
        if (res.rows.length > 0) {
            console.log("Project found:", res.rows[0]);
        } else {
            console.log("Project INHOUSE00003 NOT FOUND.");

            // List all projects to see what's there
            const allProjects = await db.query("SELECT project_code, project_name FROM projects");
            console.log("Existing projects:", allProjects.rows);
        }
    } catch (err) {
        console.error("Error executing query", err);
    } finally {
        process.exit();
    }
}

checkProject();
