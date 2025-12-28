const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🔄 Checking database tables...');

    try {
        // Check if tables exist
        const result = await db.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'projects'
    `);

        const tablesExist = parseInt(result.rows[0].count) > 0;

        if (tablesExist) {
            console.log('✅ Database tables already exist. Checking seed data...');

            // Ensure default user exists
            await db.query(`
                INSERT INTO users (id, username, email, full_name, is_active) VALUES
                (1, 'system', 'system@insight-financial.com', 'System User', TRUE)
                ON CONFLICT (id) DO NOTHING
            `);

            // Clean up any whitespace in project codes
            await db.query(`UPDATE projects SET project_code = TRIM(project_code) WHERE project_code != TRIM(project_code)`);

            // Seed sample products if not exist
            await db.query(`
                INSERT INTO products (code, name, category, description, is_active) VALUES
                ('PROD001', 'Leadership Development', 'Training', 'หลักสูตรพัฒนาภาวะผู้นำ', TRUE),
                ('PROD002', 'Team Building Workshop', 'Workshop', 'หลักสูตร Team Building', TRUE),
                ('PROD003', 'Communication Skills', 'Training', 'หลักสูตรทักษะการสื่อสาร', TRUE),
                ('PROD004', 'Project Management', 'Training', 'หลักสูตรการบริหารโครงการ', TRUE),
                ('PROD005', 'Creative Thinking', 'Workshop', 'หลักสูตรความคิดสร้างสรรค์', TRUE),
                ('PROD006', 'Customer Service Excellence', 'Training', 'หลักสูตรการบริการลูกค้า', TRUE),
                ('PROD007', 'Time Management', 'Training', 'หลักสูตรการบริหารเวลา', TRUE),
                ('PROD008', 'Presentation Skills', 'Training', 'หลักสูตรทักษะการนำเสนอ', TRUE)
                ON CONFLICT (code) DO NOTHING
            `);

            console.log('✅ Seed data verified.');
            return true;
        }

        console.log('📦 Creating database tables...');

        // Read and run schema.sql
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await db.query(schema);

        console.log('✅ Database migration completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Migration error:', error.message);
        // Don't crash server, just log error
        return false;
    }
}

module.exports = runMigration;
