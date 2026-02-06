const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

const login = async (username, password) => {
    // 1. Find user by username
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
        throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // 2. Check password
    if (!user.password_hash) {
        // Fallback for legacy users without password (should not happen with seed)
        // Maybe allow plain text comparison if you are migrating? 
        // For now, assume hashing.
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // 3. Generate Token
    const payload = {
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    // 4. Return user info (excluding password) and token
    const { password_hash, ...userInfo } = user;
    return { user: userInfo, token };
};

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

module.exports = {
    login,
    hashPassword
};
