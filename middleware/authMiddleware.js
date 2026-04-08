const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'civic-secret-key-2026';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: "No token provided. Access denied." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid Token." });
        }
        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;