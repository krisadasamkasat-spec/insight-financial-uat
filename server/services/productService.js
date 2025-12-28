const db = require('../db');

// --- PRODUCTS ---

const getAllProducts = async () => {
    const result = await db.query('SELECT * FROM products WHERE is_active = true ORDER BY category, code');
    return result.rows;
};

const createProduct = async (productData) => {
    const { code, name, category, description, is_active } = productData;
    const result = await db.query(
        `INSERT INTO products (code, name, category, description, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [code, name, category, description, is_active !== undefined ? is_active : true]
    );
    return result.rows[0];
};

const updateProduct = async (code, productData) => {
    const { name, category, description, is_active } = productData;
    const result = await db.query(
        `UPDATE products
         SET name = COALESCE($2, name),
             category = COALESCE($3, category),
             description = COALESCE($4, description),
             is_active = COALESCE($5, is_active),
             updated_at = NOW()
         WHERE code = $1
         RETURNING *`,
        [code, name, category, description, is_active]
    );
    return result.rows[0];
};

const deleteProduct = async (code) => {
    // Soft delete or hard delete? The user says "Delete", but products might be linked to projects.
    // Let's assume hard delete for now, but usually is_active=false is safer.
    // However, if the user explicitly wants to delete mock data, let's implement database DELETE.
    // If it fails due to FK, API will return error.
    const result = await db.query('DELETE FROM products WHERE code = $1 RETURNING code', [code]);
    return result.rows[0];
};

// --- CATEGORIES ---

const getAllCategories = async () => {
    const result = await db.query('SELECT * FROM product_categories ORDER BY code');
    return result.rows;
};

const createCategory = async (catData) => {
    const { code, label, color } = catData;
    const result = await db.query(
        `INSERT INTO product_categories (code, label, color)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [code, label, color]
    );
    return result.rows[0];
};

const updateCategory = async (code, catData) => {
    const { label, color } = catData;
    const result = await db.query(
        `UPDATE product_categories
         SET label = COALESCE($2, label),
             color = COALESCE($3, color),
             updated_at = NOW()
         WHERE code = $1
         RETURNING *`,
        [code, label, color]
    );
    return result.rows[0];
};

const deleteCategory = async (code) => {
    const result = await db.query('DELETE FROM product_categories WHERE code = $1 RETURNING code', [code]);
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
