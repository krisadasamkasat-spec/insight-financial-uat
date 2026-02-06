const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Helper to generate a code prefix from a category name
function generatePrefix(name) {
    // Manual overrides for known categories to look nice
    const overrides = {
        'Generative AI': 'GENAI',
        'Advance AI': 'ADVAI',
        'Skills Beyond AI': 'SKILLS',
        'Journey Programs': 'JOURNEY',
        'Training': 'TRAIN',
        'Consulting': 'CONSULT',
        'Other': 'OTHER',
        'Automation': 'AUTO',
        'PR-Event': 'EVENT',
        'CSR': 'CSR',
        'E-Learning': 'ELEARN'
    };

    if (overrides[name]) return overrides[name];

    // Default: First 4 letters uppercase, remove non-chars
    return name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'MISC';
}

function findBackupFile() {
    const rootDir = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(rootDir);
    const backupFiles = files.filter(f => f.startsWith('db_backup_') && f.endsWith('.json')).sort().reverse();
    return backupFiles.length > 0 ? path.join(rootDir, backupFiles[0]) : null;
}

async function resetDatabase() {
    const backupPath = findBackupFile();
    if (!backupPath) {
        console.error("❌ No backup file found in root directory! Cannot seed existing data.");
        process.exit(1);
    }

    console.log(`📦 Found backup file: ${backupPath}`);
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    const client = await pool.connect();
    try {
        console.log('🔄 Starting Database Reset...');

        // 1. Drop & Recreate Schema
        console.log('🔥 Dropping all tables...');
        await client.query('DROP SCHEMA public CASCADE;');
        await client.query('CREATE SCHEMA public;');
        await client.query('GRANT ALL ON SCHEMA public TO public;');

        // 2. Apply New Schema
        console.log('🏗️ Applying new schema...');
        const schemaPath = path.join(__dirname, 'schema_new.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);

        // 3. Seed Reference Data from Backup
        console.log('🌱 Seeding Reference Data from Backup...');

        // 3.1 Account Codes
        if (backupData.account_codes && backupData.account_codes.length > 0) {
            console.log(`   - Seeding ${backupData.account_codes.length} account codes...`);
            for (const ac of backupData.account_codes) {
                await client.query(
                    `INSERT INTO account_codes (account_code, account_description) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [ac.code, ac.title]
                );
            }
        }

        // 3.2 Project Types
        if (backupData.project_types && backupData.project_types.length > 0) {
            console.log(`   - Seeding ${backupData.project_types.length} project types...`);

            // Helper for Project Type Prefixes
            const getProjectPrefix = (name) => {
                const map = {
                    'In-House': 'INHOUSE',
                    'Consult': 'CONSULT',
                    'Public': 'PUBLIC',
                    'Central': 'CENTRAL', // Or PARTNER? User said 'ส่วนกลาง' maybe 'CENTRAL' ok
                    'MORE': 'MORE',
                    'Salevity': 'SALE',
                    'TMT': 'TMT',
                    'Automation': 'AUTO',
                    'PR-Event': 'EVENT',
                    'CSR': 'CSR',
                    'E-Learning': 'ELEARN'
                };
                return map[name] || name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'PROJ';
            };

            for (const pt of backupData.project_types) {
                const prefix = getProjectPrefix(pt.value);
                await client.query(
                    `INSERT INTO project_types (name, label, code_prefix) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                    [pt.value, pt.label, prefix]
                );
            }
        }

        // 3.3 Users (Admin Only)
        await client.query(`
            INSERT INTO users (username, name, role, is_active) 
            VALUES ('admin', 'System Admin', 'admin', true)
            ON CONFLICT DO NOTHING
        `);

        // 3.4 Product Categories & Products (With Code Regeneration)
        const products = backupData.products || [];
        const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

        console.log(`   - Seeding ${uniqueCategories.length} product categories...`);
        const categoryMap = new Map(); // name -> id
        const categoryPrefixMap = new Map(); // name -> prefix

        for (const catName of uniqueCategories) {
            const prefix = generatePrefix(catName);
            const res = await client.query(
                `INSERT INTO product_categories (name, code_prefix) VALUES ($1, $2) RETURNING id`,
                [catName, prefix]
            );
            categoryMap.set(catName, res.rows[0].id);
            categoryPrefixMap.set(catName, prefix);
        }

        console.log(`   - Seeding ${products.length} products (Regenerating Codes)...`);

        // Helper to track running number per category
        const categoryCounters = {};

        for (const p of products) {
            const catId = categoryMap.get(p.category);
            const prefix = categoryPrefixMap.get(p.category);

            if (catId && prefix) {
                // Initialize counter if needed
                if (!categoryCounters[prefix]) categoryCounters[prefix] = 1;

                // Generate New Code: PREFIX + 001
                const runningNum = categoryCounters[prefix]++;
                const newCode = `${prefix}${String(runningNum).padStart(3, '0')}`; // e.g., GENAI001

                await client.query(
                    `INSERT INTO products (product_code, product_category_id, product_name, description, is_active)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT DO NOTHING`,
                    [newCode, catId, p.name, p.description, p.is_active]
                );
            }
        }

        // 3.5 Financial Accounts (Default)
        await client.query(`
            INSERT INTO financial_accounts (bank_name, financial_account_name, financial_account_number, balance)
            VALUES ('KBANK', 'Main Company Account', '000-0-00000-0', 0.00)
        `);

        console.log('✅ Database Reset & Seed from Backup Completed Successfully!');

    } catch (err) {
        console.error('❌ Error resetting database:', err);
    } finally {
        client.release();
        pool.end();
    }
}

resetDatabase();
