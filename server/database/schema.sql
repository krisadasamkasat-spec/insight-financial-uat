-- =====================================================
-- Insight Financial - Full Database Schema
-- Version: 1.0.0
-- Generated: 2025-12-28
-- =====================================================

-- =====================================================
-- 1. REFERENCE DATA TABLES
-- =====================================================

-- Roles Table (for Team Members)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Types Table
CREATE TABLE IF NOT EXISTS project_types (
    id SERIAL PRIMARY KEY,
    value VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Statuses Table (for Income & Expense)
CREATE TABLE IF NOT EXISTS financial_statuses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,  -- 'income' or 'expense'
    value VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, value)
);

-- Expense Codes Table
CREATE TABLE IF NOT EXISTS expense_codes (
    code VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. CORE BUSINESS TABLES
-- =====================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    type VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    tax_id VARCHAR(20),
    is_company BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. PROJECT MANAGEMENT TABLES
-- =====================================================

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    project_code VARCHAR(50) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(50) REFERENCES products(code),
    customer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    project_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    description TEXT,
    budget NUMERIC(15, 2),
    participant_count INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Team Junction Table
CREATE TABLE IF NOT EXISTS project_team (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(50) REFERENCES projects(project_code) ON DELETE CASCADE,
    member_id INTEGER REFERENCES team_members(id),
    role VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. FINANCIAL TABLES
-- =====================================================

-- Financial Accounts Table
CREATE TABLE IF NOT EXISTS financial_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    account_number VARCHAR(50),
    bank_code VARCHAR(20),
    balance NUMERIC(15, 2) DEFAULT 0,
    color VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incomes Table
CREATE TABLE IF NOT EXISTS incomes (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(50) REFERENCES projects(project_code),
    description TEXT,
    invoice_no VARCHAR(100),
    date DATE,
    amount NUMERIC(15, 2),
    status VARCHAR(50) DEFAULT 'pending',
    account_id INTEGER REFERENCES financial_accounts(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(50) REFERENCES expense_codes(code),
    project_code VARCHAR(50) REFERENCES projects(project_code),
    expense_type VARCHAR(100),
    contact VARCHAR(255),
    bill_header VARCHAR(255),
    payback_to VARCHAR(255),
    description TEXT,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    price NUMERIC(15, 2),
    discount NUMERIC(15, 2) DEFAULT 0,
    vat_amount NUMERIC(15, 2) DEFAULT 0,
    wht_amount NUMERIC(15, 2) DEFAULT 0,
    net_amount NUMERIC(15, 2),
    due_date DATE,
    internal_status VARCHAR(100),
    peak_status VARCHAR(100),
    report_month VARCHAR(50),
    status VARCHAR(50) DEFAULT 'วางบิล',
    issue_date DATE,
    payment_date DATE,
    account_id INTEGER REFERENCES financial_accounts(id),
    file_path VARCHAR(500),
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    reject_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. SEED REFERENCE DATA
-- =====================================================

-- Seed Roles
INSERT INTO roles (name, label) VALUES
('Trainer', 'Trainer'),
('Co-Trainer', 'Co-Trainer'),
('MC', 'MC (Master of Ceremony)'),
('TA', 'Training Assistant (TA)'),
('Coordinator', 'Training Coordinator'),
('TMT', 'Training Management Team (TMT)')
ON CONFLICT (name) DO NOTHING;

-- Seed Project Types
INSERT INTO project_types (value, label) VALUES
('Consult', 'Consult'),
('In-House', 'In-House'),
('Public', 'Public'),
('Event', 'Event'),
('Gift', 'Gift'),
('R&D', 'R&D'),
('Other', 'Other')
ON CONFLICT (value) DO NOTHING;

-- Seed Financial Statuses
INSERT INTO financial_statuses (category, value, label, description) VALUES
-- Income Statuses
('income', 'pending', 'รอรับ', 'Waiting for payment'),
('income', 'Received', 'ได้รับแล้ว', 'Payment received'),
-- Expense Statuses
('expense', 'วางบิล', 'วางบิล', 'Invoice placed'),
('expense', 'สำรองจ่าย', 'สำรองจ่าย', 'Advance payment'),
('expense', 'จ่ายแล้ว', 'จ่ายแล้ว', 'Paid')
ON CONFLICT (category, value) DO NOTHING;

-- Seed Expense Codes (Actual Data - รหัสค่าใช้จ่าย)
INSERT INTO expense_codes (code, title, description) VALUES
-- ต้นทุนการจัดอบรม (510xxx)
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
-- ค่าใช้จ่ายในการขาย (520xxx)
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
-- ค่าใช้จ่ายในการบริหาร (530xxx)
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
ON CONFLICT (code) DO NOTHING;

-- Seed Products (หลักสูตร - Actual Data)
INSERT INTO products (code, name, category, description, is_active) VALUES
-- Advance AI Products
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
-- Other Products
('CANVA', 'Canva for Business', 'OTHER', 'อื่นๆ', TRUE),
-- Generative AI Products
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
-- More Other Products
('IMPT-PITCHING', 'Impact Pitch for Sales', 'OTHER', 'อื่นๆ', TRUE),
('INS-DATA-ANALYTIC', 'Data Analytic And Visualization Made Easy With AI', 'OTHER', 'อื่นๆ', TRUE),
-- Journey Programs
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
-- More Other Products
('LOGIC', 'Business Logical Thinking In The Age of AI', 'OTHER', 'อื่นๆ', TRUE),
('PNEGO', 'Psychological Negotiation Tactics (With AI Assistance)', 'OTHER', 'อื่นๆ', TRUE),
('POC-MENTOR', 'Project Mentoring (POC)', 'OTHER', 'อื่นๆ', TRUE),
('PPTDE', 'Psychology of Presentation Design', 'OTHER', 'อื่นๆ', TRUE),
('SALE-AJBALLY', 'Sale by AjBally', 'OTHER', 'อื่นๆ', TRUE),
-- Skills Beyond AI Products
('SKLBEYOND-COMMU', 'Communication', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
('SKLBEYOND-COMMU-PRESENT', 'Insight-Driven Powerful Presentation', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
('SKLBEYOND-CRITICAL', 'Critical Thinking', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
('SKLBEYOND-DT-AI', 'Design Thinking + AI', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
('SKLBEYOND-TEAM-MGMT', 'Team Management', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
('SKLBEYOND-THINK-DESIGN', 'Design Thinking', 'SKLBEYOND', 'Skills Beyond AI', TRUE),
-- More Other Products
('TIMEP', 'Time & Prioritize Psychology Management', 'OTHER', 'อื่นๆ', TRUE),
-- Training Products
('TRAIN-ITEQUIP', 'หยุดตบตี อุปกรณ์ IT ในห้องเรียน', 'TRAIN', 'Training', TRUE),
('TRAIN-LED', 'LED Workshop Design', 'TRAIN', 'Training', TRUE),
('TRAIN-TRANSFORMATIVE', 'Become Transformative Trainer', 'TRAIN', 'Training', TRUE),
('TRAIN-WOWFA', 'Wow Facilitator', 'TRAIN', 'Training', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed Default User (required for foreign key references)
INSERT INTO users (id, username, email, full_name, is_active) VALUES
(1, 'system', 'system@insight-financial.com', 'System User', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for users table
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_incomes_project_code ON incomes(project_code);
CREATE INDEX IF NOT EXISTS idx_incomes_status ON incomes(status);
CREATE INDEX IF NOT EXISTS idx_expenses_project_code ON expenses(project_code);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_project_team_project ON project_team(project_code);
CREATE INDEX IF NOT EXISTS idx_project_team_member ON project_team(member_id);

-- =====================================================
-- DONE! Database schema created successfully.
-- =====================================================
