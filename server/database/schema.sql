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
    expense_code VARCHAR(50) REFERENCES expense_codes(code),
    project_code VARCHAR(50) REFERENCES projects(project_code),
    description TEXT,
    recipient_id INTEGER REFERENCES team_members(id),
    amount NUMERIC(15, 2),
    wht_rate NUMERIC(5, 2),
    wht_amount NUMERIC(15, 2),
    net_amount NUMERIC(15, 2),
    status VARCHAR(50) DEFAULT 'วางบิล',
    issue_date DATE,
    payment_date DATE,
    account_id INTEGER REFERENCES financial_accounts(id),
    file_path VARCHAR(500),
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

-- Seed Expense Codes (common categories)
INSERT INTO expense_codes (code, title, description) VALUES
('TRAINER_FEE', 'Trainer Fee', 'ค่าตอบแทนวิทยากร'),
('MATERIAL', 'Material', 'ค่าวัสดุอุปกรณ์'),
('TRAVEL', 'Travel', 'ค่าเดินทาง'),
('ACCOMMODATION', 'Accommodation', 'ค่าที่พัก'),
('FOOD', 'Food & Beverage', 'ค่าอาหารและเครื่องดื่ม'),
('VENUE', 'Venue', 'ค่าสถานที่'),
('MARKETING', 'Marketing', 'ค่าการตลาด'),
('OTHER', 'Other', 'อื่นๆ')
ON CONFLICT (code) DO NOTHING;

-- Seed Sample Products (หลักสูตร)
INSERT INTO products (code, name, category, description, is_active) VALUES
('PROD001', 'Leadership Development', 'Training', 'หลักสูตรพัฒนาภาวะผู้นำ', TRUE),
('PROD002', 'Team Building Workshop', 'Workshop', 'หลักสูตร Team Building', TRUE),
('PROD003', 'Communication Skills', 'Training', 'หลักสูตรทักษะการสื่อสาร', TRUE),
('PROD004', 'Project Management', 'Training', 'หลักสูตรการบริหารโครงการ', TRUE),
('PROD005', 'Creative Thinking', 'Workshop', 'หลักสูตรความคิดสร้างสรรค์', TRUE),
('PROD006', 'Customer Service Excellence', 'Training', 'หลักสูตรการบริการลูกค้า', TRUE),
('PROD007', 'Time Management', 'Training', 'หลักสูตรการบริหารเวลา', TRUE),
('PROD008', 'Presentation Skills', 'Training', 'หลักสูตรทักษะการนำเสนอ', TRUE)
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
