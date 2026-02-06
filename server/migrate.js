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

            // Ensure default user exists (with explicit sequence handling)
            try {
                await db.query(`
                    INSERT INTO users (id, username, name, role, is_active) 
                    OVERRIDING SYSTEM VALUE
                    VALUES (1, 'system', 'System User', 'system', TRUE)
                    ON CONFLICT (id) DO NOTHING
                `);
                console.log('✅ Default user verified.');
            } catch (userErr) {
                console.log('⚠️ User seed skipped (may already exist):', userErr.message);
            }

            // Clean up any whitespace in project codes
            await db.query(`UPDATE projects SET project_code = TRIM(project_code) WHERE project_code != TRIM(project_code)`);

            // Add missing columns to expenses table if they don't exist
            const alterExpenseQueries = [
                `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)`,
                `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id)`,
                `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`,
                `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reject_reason TEXT`,
                `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(id)`,
                `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP`
            ];

            for (const q of alterExpenseQueries) {
                try {
                    await db.query(q);
                } catch (e) {
                    // Ignore if column already exists
                }
            }

            // Create contacts tables if not exist
            const contactsTableExists = await db.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'contacts'
            `);

            if (parseInt(contactsTableExists.rows[0].count) === 0) {
                console.log('📋 Creating contacts tables...');
                await db.query(`
                    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
                    
                    CREATE TABLE IF NOT EXISTS contacts (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('individual', 'juristic')),
                        tax_id VARCHAR(13),
                        branch_code VARCHAR(10) DEFAULT '00000',
                        name_th VARCHAR(255) NOT NULL,
                        name_en VARCHAR(255),
                        nick_name VARCHAR(100),
                        phone VARCHAR(50) NOT NULL,
                        mobile VARCHAR(50),
                        email VARCHAR(255),
                        address_registration TEXT,
                        address_shipping TEXT,
                        bank_name VARCHAR(100),
                        bank_account_number VARCHAR(50),
                        bank_account_name VARCHAR(255),
                        role VARCHAR(100),
                        note TEXT,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE INDEX IF NOT EXISTS idx_contacts_tax_id ON contacts(tax_id);
                    CREATE INDEX IF NOT EXISTS idx_contacts_name_th ON contacts(name_th);
                    CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
                    CREATE INDEX IF NOT EXISTS idx_contacts_entity_type ON contacts(entity_type);

                    CREATE TABLE IF NOT EXISTS contact_documents (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
                        document_type VARCHAR(50) NOT NULL,
                        file_name VARCHAR(255) NOT NULL,
                        file_path TEXT NOT NULL,
                        file_size INT,
                        file_ext VARCHAR(10),
                        is_active BOOLEAN DEFAULT TRUE,
                        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE INDEX IF NOT EXISTS idx_contact_docs_contact ON contact_documents(contact_id);
                `);
                console.log('✅ Contacts tables created.');
            }

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

            // Seed actual expense codes if not exist
            await db.query(`
                INSERT INTO expense_codes (code, title, description) VALUES
                ('510110', 'ต้นทุนเทรนเนอร์ /Cost of Trainer', 'ต้นทุนการจัดอบรม'),
                ('510111', 'ต้นทุน Co-Trainer /Cost of Co-Trainer', 'ต้นทุนการจัดอบรม'),
                ('510112', 'ต้นทุน MC Cost of MC', 'ต้นทุนการจัดอบรม'),
                ('510113', 'ต้นทุน TA /Cost of TA', 'ต้นทุนการจัดอบรม'),
                ('510114', 'ต้นทุน Training Coordinator', 'ต้นทุนการจัดอบรม'),
                ('510115', 'ต้นทุนทีม Light & Sound', 'ต้นทุนการจัดอบรม'),
                ('510116', 'ต้นทุนเอกสารประกอบจัดอบรม /Cost of Training Document', 'ต้นทุนการจัดอบรม'),
                ('510117', 'ต้นทุนอุปกรณ์แจกเพื่อส่วนหนึ่งอบรม /Cost of Training Others', 'ต้นทุนการจัดอบรม'),
                ('510118', 'ต้นทุนของรางวัลในการอบรม /Prize or reward expenses', 'ต้นทุนการจัดอบรม'),
                ('510119', 'ต้นทุนช่างภาพนิ่ง /Production Cost', 'ต้นทุนการจัดอบรม'),
                ('510120', 'ต้นทุนช่างภาพวิดิโอ /Production VDO Cost', 'ต้นทุนการจัดอบรม'),
                ('510121', 'ต้นทุนทีมถ่ายทำ / ตัดต่อ คอร์สออนไลน์', 'ต้นทุนการจัดอบรม'),
                ('510122', 'ต้นทุนค่าสถานที่ / ห้องสัมมนา /Cost of Location', 'ต้นทุนการจัดอบรม'),
                ('510123', 'ต้นทุนค่าอาหาร / กาแฟ วิทยากร /Cost of food (trainer)', 'ต้นทุนการจัดอบรม'),
                ('510124', 'ต้นทุนค่าลิขสิทธ์หลักสูตร /Course license costs', 'ต้นทุนการจัดอบรม'),
                ('510125', 'ต้นทุนค่าเดินทาง / ที่พัก /Transportation Cost', 'ต้นทุนการจัดอบรม'),
                ('510126', 'ต้นทุน ส่งของหน้างาน วางบิล /Messenger', 'ต้นทุนการจัดอบรม'),
                ('510127', 'ต้นทุนคอร์สออนไลน์ E-Learning /Platform E-Learning', 'ต้นทุนการจัดอบรม'),
                ('510128', 'ต้นทุนอื่นๆ /Others', 'ต้นทุนการจัดอบรม'),
                ('510129', 'ต้นทุน TMT', 'ต้นทุนการจัดอบรม'),
                ('520103', 'เงินเดือน-พนักงานขาย /Sales Salary', 'ค่าใช้จ่ายในการขาย'),
                ('520104', 'ค่านายหน้าพนักงาน /Sales commission', 'ค่าใช้จ่ายในการขาย'),
                ('520105', 'โบนัส-พนักงานขาย /Bonus on sales', 'ค่าใช้จ่ายในการขาย'),
                ('520106', 'Commission Partners', 'ค่าใช้จ่ายในการขาย'),
                ('520219', 'ค่าจ้างที่ปรึกษาการขาย /Sales consulting service expenses', 'ค่าใช้จ่ายในการขาย'),
                ('520220', 'ค่าจ้างที่ปรึกษาการตลาด /Marketing consulting service expenses', 'ค่าใช้จ่ายในการขาย'),
                ('520221', 'ค่าออกแบบและผลิตสื่อชิ้นงาน /Design cost', 'ค่าใช้จ่ายในการขาย'),
                ('520222', 'ค่าออกบูธและทีมงานออกบูธ /Space rental and event related expenses', 'ค่าใช้จ่ายในการขาย'),
                ('520223', 'BNI /Business Network International', 'ค่าใช้จ่ายในการขาย'),
                ('520224', 'ค่าเขียน Content และ Graphic /Content Creating Cost', 'ค่าใช้จ่ายในการขาย'),
                ('520225', 'ค่าจ้างทำเว็บ และ SEO /Website and SEO Cost', 'ค่าใช้จ่ายในการขาย'),
                ('520226', 'ค่า Ads Facebook / Instagram', 'ค่าใช้จ่ายในการขาย'),
                ('520227', 'ค่า Ads Google / Youtube', 'ค่าใช้จ่ายในการขาย'),
                ('520228', 'ค่า Ads Tiktok', 'ค่าใช้จ่ายในการขาย'),
                ('520229', 'ค่า LINE OA', 'ค่าใช้จ่ายในการขาย'),
                ('520230', 'ค่า Marketing Social Media /Advertising media production cost', 'ค่าใช้จ่ายในการขาย'),
                ('520310', 'ค่าโทรศัพท์พนักขาย /Sales communication expenses', 'ค่าใช้จ่ายในการขาย'),
                ('520311', 'ค่าเดินทาง/ค่าพาหนะพนักงาน /Travel allowance expenses', 'ค่าใช้จ่ายในการขาย'),
                ('520312', 'สวัสดิการพนักงานขายอื่น /Other sales staff welfare', 'ค่าใช้จ่ายในการขาย'),
                ('520313', 'ค่าของขวัญตามเทศกาลให้ลูกค้า /Cost of gifts', 'ค่าใช้จ่ายในการขาย'),
                ('520314', 'ค่าเลี้ยงรับรองลูกค้า /Entertainment and gift expenses', 'ค่าใช้จ่ายในการขาย'),
                ('520315', 'ค่าจ้างพนักงาน PR', 'ค่าใช้จ่ายในการขาย'),
                ('520316', 'ค่าใช้จ่ายในการขายอื่นๆ /Others on sales cost', 'ค่าใช้จ่ายในการขาย'),
                ('530116', 'เงินเดือน /Wages and salary', 'ค่าใช้จ่ายในการบริหาร'),
                ('530117', 'โบนัส /Bonus', 'ค่าใช้จ่ายในการบริหาร'),
                ('530213', 'ค่าโทรศัพท์ สำนักงาน /Utility expenses - telephone', 'ค่าใช้จ่ายในการบริหาร'),
                ('530214', 'สวัสดิการพนักงาน /Other welfare expenses', 'ค่าใช้จ่ายในการบริหาร'),
                ('530215', 'ค่าเช่าห้องประชุมภายใน /Meeting Room', 'ค่าใช้จ่ายในการบริหาร'),
                ('530216', 'ค่าเช่าห้องประชุมรายเดือน /Meeting Room', 'ค่าใช้จ่ายในการบริหาร'),
                ('530217', 'ค่าส่ง/ไปรษณีย์(ที่ไม่ใช่เอกสาร)', 'ค่าใช้จ่ายในการบริหาร'),
                ('530218', 'ค่าเครื่องเขียน/วัสดุอุปกรณ์ /Stationery and supplies expenses', 'ค่าใช้จ่ายในการบริหาร'),
                ('530307', 'ค่าสาธารณูปโภค /Utilities', 'ค่าใช้จ่ายในการบริหาร'),
                ('530409', 'ค่าที่ปรึกษาธุรกิจ', 'ค่าใช้จ่ายในการบริหาร'),
                ('530410', 'ค่าทำบัญชี /service expenses - bookkeeping', 'ค่าใช้จ่ายในการบริหาร'),
                ('530411', 'ค่าสอบบัญชี /service expenses - auditing fee', 'ค่าใช้จ่ายในการบริหาร'),
                ('530412', 'System Support (App, ChatGPT)', 'ค่าใช้จ่ายในการบริหาร'),
                ('530413', 'System Development', 'ค่าใช้จ่ายในการบริหาร'),
                ('530414', 'ค่าจ้างทำของ /Hire of work expenses', 'ค่าใช้จ่ายในการบริหาร'),
                ('530415', 'ค่าอบรมพัฒนาพนักงาน /Training seminar', 'ค่าใช้จ่ายในการบริหาร'),
                ('530416', 'ค่าจ้างจัดทำเและตรวจสอบบัญชี', 'ค่าใช้จ่ายในการบริหาร'),
                ('530417', 'ค่าจ้างวิจัยและออกแบบหลักสูตร /R&D personel cost', 'ค่าใช้จ่ายในการบริหาร'),
                ('530418', 'ค่าจ้างฝ่ายกฏหมาย /สัญญา', 'ค่าใช้จ่ายในการบริหาร')
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
