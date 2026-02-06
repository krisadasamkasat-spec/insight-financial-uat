-- ==========================================
-- 1. SCHEMA SETUP (Tables & Constraints)
-- ==========================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Setup Tables
CREATE TABLE IF NOT EXISTS public.account_codes (
    account_code character varying(50) NOT NULL PRIMARY KEY,
    account_description text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.product_categories (
    id SERIAL PRIMARY KEY,
    name character varying(255) NOT NULL UNIQUE,
    code_prefix character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.products (
    product_code character varying(50) NOT NULL PRIMARY KEY,
    product_category_id integer REFERENCES public.product_categories(id),
    product_name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.project_types (
    id SERIAL PRIMARY KEY,
    name character varying(255) NOT NULL UNIQUE,
    label character varying(255),
    code_prefix character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username character varying(255) NOT NULL UNIQUE,
    password_hash character varying(255),
    name character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.projects (
    project_code character varying(50) NOT NULL PRIMARY KEY,
    project_type_id integer REFERENCES public.project_types(id),
    project_name character varying(255),
    product_code character varying(50) REFERENCES public.products(product_code),
    customer_name character varying(255),
    participant_count integer,
    budget numeric(15,2),
    description text,
    status character varying(50) DEFAULT 'Active',
    created_by integer REFERENCES public.users(id),
    updated_by integer REFERENCES public.users(id),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id SERIAL PRIMARY KEY,
    bank_name character varying(100),
    financial_account_number character varying(50),
    financial_account_name character varying(255),
    balance numeric(15,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.expense_lists (
    id SERIAL PRIMARY KEY,
    project_code character varying(50) REFERENCES public.projects(project_code),
    account_code character varying(50) REFERENCES public.account_codes(account_code),
    expense_type character varying(100),
    contact character varying(255),
    bill_header character varying(255),
    payback_to character varying(255),
    description text,
    phone character varying(50),
    email character varying(255),
    bank_name character varying(100),
    bank_account_number character varying(50),
    bank_account_name character varying(255),
    amount numeric(15,2),
    discount numeric(15,2) DEFAULT 0,
    vat numeric(5,2) DEFAULT 0,
    vat_amount numeric(15,2) DEFAULT 0,
    wht numeric(5,2) DEFAULT 0,
    wht_amount numeric(15,2) DEFAULT 0,
    net_amount numeric(15,2),
    issue_date date,
    due_date date,
    internal_status character varying(50) DEFAULT 'Draft',
    created_by integer REFERENCES public.users(id),
    updated_by integer, -- REFERENCES public.users(id),
    approved_by integer REFERENCES public.users(id),
    approved_at timestamp without time zone,
    rejected_by integer REFERENCES public.users(id),
    rejected_at timestamp without time zone,
    reject_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.expense_attachments (
    id SERIAL PRIMARY KEY,
    expense_id integer REFERENCES public.expense_lists(id) ON DELETE CASCADE,
    file_name character varying(255),
    file_path character varying(500) NOT NULL,
    source character varying(50),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.income_lists (
    id SERIAL PRIMARY KEY,
    project_code character varying(50) REFERENCES public.projects(project_code),
    amount numeric(15,2),
    description text,
    financial_account_id integer REFERENCES public.financial_accounts(id),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    due_date date,
    status character varying(20) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS public.income_attachments (
    id SERIAL PRIMARY KEY,
    income_id integer REFERENCES public.income_lists(id) ON DELETE CASCADE,
    file_name character varying(255),
    file_path character varying(500) NOT NULL,
    source character varying(50),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.product_categories (
    id SERIAL PRIMARY KEY,
    name character varying(255) NOT NULL UNIQUE,
    code_prefix character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.project_dates (
    id SERIAL PRIMARY KEY,
    project_code character varying(50) REFERENCES public.projects(project_code) ON DELETE CASCADE,
    date_name character varying(255),
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    location character varying(255),
    description text,
    created_by integer REFERENCES public.users(id),
    updated_by integer REFERENCES public.users(id),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type character varying(20) NOT NULL CHECK (entity_type IN ('individual', 'juristic')),
    tax_id character varying(13),
    branch_code character varying(10) DEFAULT '00000',
    name_th character varying(255) NOT NULL,
    name_en character varying(255),
    nick_name character varying(100),
    phone character varying(50) NOT NULL,
    mobile character varying(50),
    email character varying(255),
    address_registration text,
    address_shipping text,
    bank_name character varying(100),
    bank_account_number character varying(50),
    bank_account_name character varying(255),
    role character varying(100),
    note text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.contact_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
    document_type character varying(50) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    file_ext character varying(10),
    is_active boolean DEFAULT true,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_docs_contact ON public.contact_documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_entity_type ON public.contacts(entity_type);
CREATE INDEX IF NOT EXISTS idx_contacts_name_th ON public.contacts(name_th);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_tax_id ON public.contacts(tax_id);
CREATE INDEX IF NOT EXISTS idx_expense_project ON public.expense_lists(project_code);
CREATE INDEX IF NOT EXISTS idx_income_project ON public.income_lists(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(project_code);


-- ==========================================
-- 2. SEED DATA (Default Values)
-- ==========================================

-- 2.1 Default System User
INSERT INTO users (id, username, name, role, is_active) 
OVERRIDING SYSTEM VALUE
VALUES (1, 'system', 'System User', 'system', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2.2 Product Categories
INSERT INTO product_categories (name, code_prefix) VALUES 
('ADVAI', 'ADVAI'), 
('GENAI', 'GENAI'), 
('JOURNEY', 'JOURNEY'), 
('SKLBEYOND', 'SKLBEYOND'), 
('TRAIN', 'TRAIN'), 
('OTHER', 'OTHER')
ON CONFLICT (name) DO NOTHING;

-- 2.3 Products
INSERT INTO products (product_code, product_name, product_category_id, description, is_active) VALUES
('ADVAI-BUILD-AI', 'Build Your AI - Customize AI Empire & Army for Business', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-CONTENT', 'Advance AI for Creative Content Creation Across Digital Platform', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-GITHUB', 'Advance AI GitHub Copilot', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-MKT-STRATEGY', 'Advance AI for Marketing Strategy', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-MKT-STUDIO', 'Advance AI for Marketing Studio', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-PRESENT', 'The Magic of AI Presentation', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-PRODUCTIVITY', 'Advance AI Tools for Future Work', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-RESEARCH', 'Advance AI For Business Research and Strategy Analysis', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-RPA', 'Advance AI Automation with RPA', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-TIME-MGMT', 'AI for Time & Prioritize Management', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),
('ADVAI-WORKFLOW', 'Advance AI Automation Workflow', (SELECT id FROM product_categories WHERE name='ADVAI'), 'Advance AI', TRUE),

('CANVA', 'Canva for Business', (SELECT id FROM product_categories WHERE name='OTHER'), 'อื่นๆ', TRUE),
('IMPT-PITCHING', 'Impact Pitch for Sales', (SELECT id FROM product_categories WHERE name='OTHER'), 'อื่นๆ', TRUE),
('INS-DATA-ANALYTIC', 'Data Analytic And Visualization Made Easy With AI', (SELECT id FROM product_categories WHERE name='OTHER'), 'อื่นๆ', TRUE),
('LOGIC', 'Business Logical Thinking In The Age of AI', (SELECT id FROM product_categories WHERE name='OTHER'), 'อื่นๆ', TRUE),
('PNEGO', 'Psychological Negotiation Tactics (With AI Assistance)', (SELECT id FROM product_categories WHERE name='OTHER'), 'อื่นๆ', TRUE),
('POC-MENTOR', 'Project Mentoring (POC)', (SELECT id FROM product_categories WHERE name='OTHER'), 'อื่นๆ', TRUE),
('PPTDE', 'Psychology of Presentation Design', (SELECT id FROM product_categories WHERE name='OTHER'), 'อื่นๆ', TRUE),
('SALE-AJBALLY', 'Sale by AjBally', (SELECT id FROM product_categories WHERE name='OTHER'), 'อื่นๆ', TRUE),
('TIMEP', 'Time & Prioritize Psychology Management', (SELECT id FROM product_categories WHERE name='OTHER'), 'อื่นๆ', TRUE),

('GENAI', 'Generative AI for All Level', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-BIZ', 'Generative AI for Business Transformation & Future Trends', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-EXECUTIVE', 'Generative AI for Executive', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-FIELD', 'Generative AI for Future Field Service', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-FINANCE', 'Generative AI for Finance', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-HALF', 'Generative AI for All Level - Half day', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-HR', 'Generative AI for HR', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-MKT', 'Generative AI for Marketing', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-OPERATION', 'Generative AI for Operation', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-RISK', 'Generative AI for Risk Management', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-SALES', 'Generative AI for Sales', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),
('GENAI-TOWNHALL', 'Generative AI for All Level - Townhall', (SELECT id FROM product_categories WHERE name='GENAI'), 'Generative AI', TRUE),

('JOURNEY-AI-EXEC', '[Journey] AI for Executive Journey', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),
('JOURNEY-AI-MENTOR', '[Journey] AI Mentoring Program', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),
('JOURNEY-AI-TRANSFORM', '[Journey] AI Transformation Program', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),
('JOURNEY-GOAL', '[Journey] Design Your Goal & Work Life Balance', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),
('JOURNEY-ORG-LEADER', '[Journey] Organizational - Leadershift', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),
('JOURNEY-PEOPLE', '[Journey] Become the Person Everyone Loves to Work With', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),
('JOURNEY-SELF-LEADER', '[Journey] SELF - Leadershift', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),
('JOURNEY-TEAM-LEADER', '[Journey] TEAM - Leadershift', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),
('JOURNEY-TIME', '[Journey] Master Your Time', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),
('JOURNEY-TRAINER', '[Journey] Transformative Trainer', (SELECT id FROM product_categories WHERE name='JOURNEY'), 'Journey Programs', TRUE),

('SKLBEYOND-COMMU', 'Communication', (SELECT id FROM product_categories WHERE name='SKLBEYOND'), 'Skills Beyond AI', TRUE),
('SKLBEYOND-COMMU-PRESENT', 'Insight-Driven Powerful Presentation', (SELECT id FROM product_categories WHERE name='SKLBEYOND'), 'Skills Beyond AI', TRUE),
('SKLBEYOND-CRITICAL', 'Critical Thinking', (SELECT id FROM product_categories WHERE name='SKLBEYOND'), 'Skills Beyond AI', TRUE),
('SKLBEYOND-DT-AI', 'Design Thinking + AI', (SELECT id FROM product_categories WHERE name='SKLBEYOND'), 'Skills Beyond AI', TRUE),
('SKLBEYOND-TEAM-MGMT', 'Team Management', (SELECT id FROM product_categories WHERE name='SKLBEYOND'), 'Skills Beyond AI', TRUE),
('SKLBEYOND-THINK-DESIGN', 'Design Thinking', (SELECT id FROM product_categories WHERE name='SKLBEYOND'), 'Skills Beyond AI', TRUE),

('TRAIN-ITEQUIP', 'หยุดตบตี อุปกรณ์ IT ในห้องเรียน', (SELECT id FROM product_categories WHERE name='TRAIN'), 'Training', TRUE),
('TRAIN-LED', 'LED Workshop Design', (SELECT id FROM product_categories WHERE name='TRAIN'), 'Training', TRUE),
('TRAIN-TRANSFORMATIVE', 'Become Transformative Trainer', (SELECT id FROM product_categories WHERE name='TRAIN'), 'Training', TRUE),
('TRAIN-WOWFA', 'Wow Facilitator', (SELECT id FROM product_categories WHERE name='TRAIN'), 'Training', TRUE)
ON CONFLICT (product_code) DO NOTHING;

-- 2.4 Account Codes (Using Title as Description)
INSERT INTO account_codes (account_code, account_description) VALUES
('510110', 'ต้นทุนเทรนเนอร์ /Cost of Trainer'),
('510111', 'ต้นทุน Co-Trainer /Cost of Co-Trainer'),
('510112', 'ต้นทุน MC Cost of MC'),
('510113', 'ต้นทุน TA /Cost of TA'),
('510114', 'ต้นทุน Training Coordinator'),
('510115', 'ต้นทุนทีม Light & Sound'),
('510116', 'ต้นทุนเอกสารประกอบจัดอบรม /Cost of Training Document'),
('510117', 'ต้นทุนอุปกรณ์แจกเพื่อส่วนหนึ่งอบรม /Cost of Training Others'),
('510118', 'ต้นทุนของรางวัลในการอบรม /Prize or reward expenses'),
('510119', 'ต้นทุนช่างภาพนิ่ง /Production Cost'),
('510120', 'ต้นทุนช่างภาพวิดิโอ /Production VDO Cost'),
('510121', 'ต้นทุนทีมถ่ายทำ / ตัดต่อ คอร์สออนไลน์'),
('510122', 'ต้นทุนค่าสถานที่ / ห้องสัมมนา /Cost of Location'),
('510123', 'ต้นทุนค่าอาหาร / กาแฟ วิทยากร /Cost of food (trainer)'),
('510124', 'ต้นทุนค่าลิขสิทธ์หลักสูตร /Course license costs'),
('510125', 'ต้นทุนค่าเดินทาง / ที่พัก /Transportation Cost'),
('510126', 'ต้นทุน ส่งของหน้างาน วางบิล /Messenger'),
('510127', 'ต้นทุนคอร์สออนไลน์ E-Learning /Platform E-Learning'),
('510128', 'ต้นทุนอื่นๆ /Others'),
('510129', 'ต้นทุน TMT'),
('520103', 'เงินเดือน-พนักงานขาย /Sales Salary'),
('520104', 'ค่านายหน้าพนักงาน /Sales commission'),
('520105', 'โบนัส-พนักงานขาย /Bonus on sales'),
('520106', 'Commission Partners'),
('520219', 'ค่าจ้างที่ปรึกษาการขาย /Sales consulting service expenses'),
('520220', 'ค่าจ้างที่ปรึกษาการตลาด /Marketing consulting service expenses'),
('520221', 'ค่าออกแบบและผลิตสื่อชิ้นงาน /Design cost'),
('520222', 'ค่าออกบูธและทีมงานออกบูธ /Space rental and event related expenses'),
('520223', 'BNI /Business Network International'),
('520224', 'ค่าเขียน Content และ Graphic /Content Creating Cost'),
('520225', 'ค่าจ้างทำเว็บ และ SEO /Website and SEO Cost'),
('520226', 'ค่า Ads Facebook / Instagram'),
('520227', 'ค่า Ads Google / Youtube'),
('520228', 'ค่า Ads Tiktok'),
('520229', 'ค่า LINE OA'),
('520230', 'ค่า Marketing Social Media /Advertising media production cost'),
('520310', 'ค่าโทรศัพท์พนักขาย /Sales communication expenses'),
('520311', 'ค่าเดินทาง/ค่าพาหนะพนักงาน /Travel allowance expenses'),
('520312', 'สวัสดิการพนักงานขายอื่น /Other sales staff welfare'),
('520313', 'ค่าของขวัญตามเทศกาลให้ลูกค้า /Cost of gifts'),
('520314', 'ค่าเลี้ยงรับรองลูกค้า /Entertainment and gift expenses'),
('520315', 'ค่าจ้างพนักงาน PR'),
('520316', 'ค่าใช้จ่ายในการขายอื่นๆ /Others on sales cost'),
('530116', 'เงินเดือน /Wages and salary'),
('530117', 'โบนัส /Bonus'),
('530213', 'ค่าโทรศัพท์ สำนักงาน /Utility expenses - telephone'),
('530214', 'สวัสดิการพนักงาน /Other welfare expenses'),
('530215', 'ค่าเช่าห้องประชุมภายใน /Meeting Room'),
('530216', 'ค่าเช่าห้องประชุมรายเดือน /Meeting Room'),
('530217', 'ค่าส่ง/ไปรษณีย์(ที่ไม่ใช่เอกสาร)'),
('530218', 'ค่าเครื่องเขียน/วัสดุอุปกรณ์ /Stationery and supplies expenses'),
('530307', 'ค่าสาธารณูปโภค /Utilities'),
('530409', 'ค่าที่ปรึกษาธุรกิจ'),
('530410', 'ค่าทำบัญชี /service expenses - bookkeeping'),
('530411', 'ค่าสอบบัญชี /service expenses - auditing fee'),
('530412', 'System Support (App, ChatGPT)'),
('530413', 'System Development'),
('530414', 'ค่าจ้างทำของ /Hire of work expenses'),
('530415', 'ค่าอบรมพัฒนาพนักงาน /Training seminar'),
('530416', 'ค่าจ้างจัดทำเและตรวจสอบบัญชี'),
('530417', 'ค่าจ้างวิจัยและออกแบบหลักสูตร /R&D personel cost'),
('530418', 'ค่าจ้างฝ่ายกฏหมาย /สัญญา')
ON CONFLICT (account_code) DO NOTHING;

-- 2.5 Project Types
INSERT INTO project_types (name, label, code_prefix) VALUES 
('Internal', 'ภายใน', 'INT'),
('External', 'ภายนอก', 'EXT')
ON CONFLICT (name) DO NOTHING;

