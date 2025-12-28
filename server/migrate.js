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

            // Seed actual products if not exist
            await db.query(`
                INSERT INTO products (code, name, category, description, is_active) VALUES
                ('ADVAI-BUILD-AI', 'Build Your AI - Customize AI Empire & Army for Business', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-CONTENT', 'Advance AI for Creative Content Creation Across Digital Platform', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-GITHUB', 'Advance AI GitHub Copilot', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-MKT-STRATEGY', 'Advance AI for Marketing Strategy', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-MKT-STUDIO', 'Advance AI for Marketing Studio', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-PRESENT', 'The Magic of AI Presentation', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-PRODUCTIVITY', 'Advance AI Tools for Future Work', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-RESEARCH', 'Advance AI For Business Research and Strategy Analysis', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-RPA', 'Advance AI Automation with RPA', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-TIME-MGMT', 'AI for Time & Prioritize Management', 'ADVAI', 'Advance AI', TRUE),
                ('ADVAI-WORKFLOW', 'Advance AI Automation Workflow', 'ADVAI', 'Advance AI', TRUE),
                ('CANVA', 'Canva for Business', 'OTHER', 'อื่นๆ', TRUE),
                ('GENAI', 'Generative AI for All Level', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-BIZ', 'Generative AI for Business Transformation & Future Trends', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-EXECUTIVE', 'Generative AI for Executive', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-FIELD', 'Generative AI for Future Field Service', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-FINANCE', 'Generative AI for Finance', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-HALF', 'Generative AI for All Level - Half day', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-HR', 'Generative AI for HR', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-MKT', 'Generative AI for Marketing', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-OPERATION', 'Generative AI for Operation', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-RISK', 'Generative AI for Risk Management', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-SALES', 'Generative AI for Sales', 'GENAI', 'Generative AI', TRUE),
                ('GENAI-TOWNHALL', 'Generative AI for All Level - Townhall', 'GENAI', 'Generative AI', TRUE),
                ('IMPT-PITCHING', 'Impact Pitch for Sales', 'OTHER', 'อื่นๆ', TRUE),
                ('INS-DATA-ANALYTIC', 'Data Analytic And Visualization Made Easy With AI', 'OTHER', 'อื่นๆ', TRUE),
                ('JOURNEY-AI-EXEC', '[Journey] AI for Executive Journey', 'JOURNEY', 'Journey Programs', TRUE),
                ('JOURNEY-AI-MENTOR', '[Journey] AI Mentoring Program', 'JOURNEY', 'Journey Programs', TRUE),
                ('JOURNEY-AI-TRANSFORM', '[Journey] AI Transformation Program', 'JOURNEY', 'Journey Programs', TRUE),
                ('JOURNEY-GOAL', '[Journey] Design Your Goal & Work Life Balance', 'JOURNEY', 'Journey Programs', TRUE),
                ('JOURNEY-ORG-LEADER', '[Journey] Organizational - Leadershift', 'JOURNEY', 'Journey Programs', TRUE),
                ('JOURNEY-PEOPLE', '[Journey] Become the Person Everyone Loves to Work With', 'JOURNEY', 'Journey Programs', TRUE),
                ('JOURNEY-SELF-LEADER', '[Journey] SELF - Leadershift', 'JOURNEY', 'Journey Programs', TRUE),
                ('JOURNEY-TEAM-LEADER', '[Journey] TEAM - Leadershift', 'JOURNEY', 'Journey Programs', TRUE),
                ('JOURNEY-TIME', '[Journey] Master Your Time', 'JOURNEY', 'Journey Programs', TRUE),
                ('JOURNEY-TRAINER', '[Journey] Transformative Trainer', 'JOURNEY', 'Journey Programs', TRUE),
                ('LOGIC', 'Business Logical Thinking In The Age of AI', 'OTHER', 'อื่นๆ', TRUE),
                ('PNEGO', 'Psychological Negotiation Tactics (With AI Assistance)', 'OTHER', 'อื่นๆ', TRUE),
                ('POC-MENTOR', 'Project Mentoring (POC)', 'OTHER', 'อื่นๆ', TRUE),
                ('PPTDE', 'Psychology of Presentation Design', 'OTHER', 'อื่นๆ', TRUE),
                ('SALE-AJBALLY', 'Sale by AjBally', 'OTHER', 'อื่นๆ', TRUE),
                ('SKLBEYOND-COMMU', 'Communication', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
                ('SKLBEYOND-COMMU-PRESENT', 'Insight-Driven Powerful Presentation', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
                ('SKLBEYOND-CRITICAL', 'Critical Thinking', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
                ('SKLBEYOND-DT-AI', 'Design Thinking + AI', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
                ('SKLBEYOND-TEAM-MGMT', 'Team Management', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
                ('SKLBEYOND-THINK-DESIGN', 'Design Thinking', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
                ('TIMEP', 'Time & Prioritize Psychology Management', 'OTHER', 'อื่นๆ', TRUE),
                ('TRAIN-ITEQUIP', 'หยุดตบตี อุปกรณ์ IT ในห้องเรียน', 'TRAIN', 'Training', TRUE),
                ('TRAIN-LED', 'LED Workshop Design', 'TRAIN', 'Training', TRUE),
                ('TRAIN-TRANSFORMATIVE', 'Become Transformative Trainer', 'TRAIN', 'Training', TRUE),
                ('TRAIN-WOWFA', 'Wow Facilitator', 'TRAIN', 'Training', TRUE)
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
