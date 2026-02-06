const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

const authenticateToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(403).json({ msg: 'Token is not valid' });
    }
};

module.exports = authenticateToken;
