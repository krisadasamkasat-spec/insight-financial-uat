awconst pool = require('../db');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
    try {
        console.log('Seeding users...');

        // 1. Create Admin User (Upsert)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt); // Default password

        // Check if admin exists
        const checkUser = await pool.query("SELECT * FROM users WHERE username = 'admin'");

        if (checkUser.rows.length > 0) {
            console.log('Admin user exists. Updating password...');
            await pool.query(
                "UPDATE users SET password_hash = $1, role = 'admin', is_active = true WHERE username = 'admin'",
                [hashedPassword]
            );
            console.log('Admin user updated.');
        } else {
            console.log('Creating admin user...');
            const insertQuery = `
                INSERT INTO users (username, password_hash, name, role, is_active)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, username;
            `;

            const res = await pool.query(insertQuery, [
                'admin',
                hashedPassword,
                'Administrator',
                'admin',
                true
            ]);
            console.log('Admin user created successfully:', res.rows[0]);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error seeding users:', err);
        process.exit(1);
    }
};

seedUsers();
