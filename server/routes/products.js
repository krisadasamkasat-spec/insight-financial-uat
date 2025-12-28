const express = require('express');
const router = express.Router();
const productService = require('../services/productService');

// --- PRODUCTS ROUTES ---

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/products
router.post('/', async (req, res) => {
    try {
        const result = await productService.createProduct(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/products/:code
router.put('/:code', async (req, res) => {
    try {
        const result = await productService.updateProduct(req.params.code, req.body);
        if (!result) return res.status(404).json({ error: 'Product not found' });
        res.json(result);
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/products/:code
router.delete('/:code', async (req, res) => {
    try {
        const result = await productService.deleteProduct(req.params.code);
        if (!result) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- CATEGORIES ROUTES ---

// GET /api/products/categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await productService.getAllCategories();
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/products/categories
router.post('/categories', async (req, res) => {
    try {
        const result = await productService.createCategory(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/products/categories/:code
router.put('/categories/:code', async (req, res) => {
    try {
        const result = await productService.updateCategory(req.params.code, req.body);
        if (!result) return res.status(404).json({ error: 'Category not found' });
        res.json(result);
    } catch (err) {
        console.error('Error updating category:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/products/categories/:code
router.delete('/categories/:code', async (req, res) => {
    try {
        const result = await productService.deleteCategory(req.params.code);
        if (!result) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
