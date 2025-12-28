-- 1. Create Roles Table (for Team Members)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Roles
INSERT INTO roles (name, label) VALUES
('Trainer', 'Trainer'),
('Co-Trainer', 'Co-Trainer'),
('MC', 'MC (Master of Ceremony)'),
('TA', 'Training Assistant (TA)'),
('Coordinator', 'Training Coordinator'),
('TMT', 'Training Management Team (TMT)')
ON CONFLICT (name) DO NOTHING;

-- 2. Create Project Types Table
CREATE TABLE IF NOT EXISTS project_types (
    id SERIAL PRIMARY KEY,
    value VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- 3. Create Financial Statuses Table (Consolidated for Income & Expense)
CREATE TABLE IF NOT EXISTS financial_statuses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'income' or 'expense'
    value VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, value)
);

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

-- Verify Data
SELECT * FROM roles;
SELECT * FROM project_types;
SELECT * FROM financial_statuses;
