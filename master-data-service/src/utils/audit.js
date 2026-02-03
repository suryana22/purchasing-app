const ActivityLog = require('../models/ActivityLog');

const logActivity = async (req, action, moduleName, targetId, details = null) => {
    try {
        await ActivityLog.create({
            user_id: req.user ? req.user.id : null,
            username: req.user ? req.user.username : 'SYSTEM',
            action,
            module: moduleName,
            target_id: targetId ? targetId.toString() : null,
            details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
            ip_address: req.ip || req.connection.remoteAddress
        });
    } catch (error) {
        console.error('Audit Logging Error:', error);
    }
};

module.exports = { logActivity };
