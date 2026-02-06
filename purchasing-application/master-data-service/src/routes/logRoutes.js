const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken } = require('../config/auth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const logs = await ActivityLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 500
        });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
