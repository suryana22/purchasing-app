const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = {
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            const user = await User.findOne({
                where: { username },
                include: [{
                    model: Role,
                    include: [Permission]
                }]
            });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // In a real app, use bcrypt.compare here
            // If password is not hashed yet (from migration), we check plain text
            const isMatch = (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))
                ? await bcrypt.compare(password, user.password)
                : user.password === password;

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const payload = {
                id: user.id,
                username: user.username,
                role: user.Role ? user.Role.name : null
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

            res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.Role ? user.Role.name : null,
                    permissions: user.Role && user.Role.Permissions ? user.Role.Permissions.map(p => p.name) : []
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};
