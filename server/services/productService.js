const db = require('../db');

// --- PRODUCTS ---

const getAllProducts = async () => {
    // Join category for display
    const result = await db.query(`
        SELECT p.*, pc.name as category_name
        FROM products p
        LEFT JOIN product_categories pc ON p.product_category_id = pc.id
        WHERE p.is_active = true 
        ORDER BY p.product_code
    `);
    return result.rows;
};

// Helper: Generate next product code
const generateProductCode = async (client, categoryId) => {
    // 1. Get Category Prefix
    const catRes = await client.query('SELECT code_prefix FROM product_categories WHERE id = $1', [categoryId]);
    if (catRes.rows.length === 0) throw new Error("Category not found");
    const prefix = catRes.rows[0].code_prefix || 'PROD';

    // 2. Find max code for this prefix
    // Assuming format PREFIX + 000
    // We can use regex or just basic matching if strictly followed
    const maxRes = await client.query(`
        SELECT product_code FROM products 
        WHERE product_code LIKE $1 
        ORDER BY product_code DESC LIMIT 1
    `, [`${prefix}%`]);

    let nextNum = 1;
    if (maxRes.rows.length > 0) {
        const lastCode = maxRes.rows[0].product_code;
        const numPart = lastCode.replace(prefix, ''); // Remove prefix
        const parsed = parseInt(numPart);
        if (!isNaN(parsed)) {
            nextNum = parsed + 1;
        }
    }

    return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

const createProduct = async (productData) => {
    const { product_name, product_category_id, description, is_active } = productData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Auto-generate code
        const newCode = await generateProductCode(client, product_category_id);

        const result = await client.query(
            `INSERT INTO products (product_code, product_name, product_category_id, description, is_active)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [newCode, product_name, product_category_id, description, is_active !== undefined ? is_active : true]
        );

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const updateProduct = async (code, productData) => {
    const { product_name, product_category_id, description, is_active } = productData;
    const result = await db.query(
        `UPDATE products
         SET product_name = COALESCE($2, product_name),
             product_category_id = COALESCE($3, product_category_id),
             description = COALESCE($4, description),
             is_active = COALESCE($5, is_active),
             updated_at = NOW()
         WHERE product_code = $1
         RETURNING *`,
        [code, product_name, product_category_id, description, is_active]
    );
    return result.rows[0];
};

const deleteProduct = async (code) => {
    // Hard delete
    const result = await db.query('DELETE FROM products WHERE product_code = $1 RETURNING product_code', [code]);
    return result.rows[0];
};

// --- CATEGORIES ---

const getAllCategories = async () => {
    const result = await db.query('SELECT * FROM product_categories ORDER BY id');
    return result.rows;
};

const createCategory = async (catData) => {
    const { name, code_prefix } = catData;
    // Generate valid prefix if missing
    const finalPrefix = code_prefix || name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();

    const result = await db.query(
        `INSERT INTO product_categories (name, code_prefix)
         VALUES ($1, $2)
         RETURNING *`,
        [name, finalPrefix]
    );
    return result.rows[0];
};

const updateCategory = async (id, catData) => {
    const { name, code_prefix } = catData;
    const result = await db.query(
        `UPDATE product_categories
         SET name = COALESCE($2, name),
             code_prefix = COALESCE($3, code_prefix)
         WHERE id = $1
         RETURNING *`,
        [id, name, code_prefix]
    );
    return result.rows[0];
};

const deleteCategory = async (id) => {
    const result = await db.query('DELETE FROM product_categories WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
};

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
