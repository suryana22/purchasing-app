const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            // Admin bypass
            if (req.user.role === 'administrator') return next();

            const User = require('../models/User');
            const Role = require('../models/Role');
            const Permission = require('../models/Permission');

            const user = await User.findByPk(req.user.id, {
                include: [{
                    model: Role,
                    include: [Permission]
                }]
            });

            if (!user || !user.Role) {
                return res.status(403).json({ error: 'Access denied. No role assigned.' });
            }

            const userPermissions = user.Role.Permissions.map(p => p.name);
            if (userPermissions.includes(permission)) {
                return next();
            }

            res.status(403).json({ error: `Forbidden: Missing permission ${permission}` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

module.exports = { authenticateToken, checkPermission };
