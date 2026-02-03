const Notification = require('../models/Notification');
const { logActivity } = require('../utils/audit');

const notificationController = {
    findAll: async (req, res) => {
        try {
            // Get last 20 notifications
            const notifications = await Notification.findAll({
                limit: 20,
                order: [['createdAt', 'DESC']]
            });
            res.status(200).json(notifications);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const notification = await Notification.findByPk(req.params.id);
            if (!notification) return res.status(404).json({ error: 'Notif not found' });

            await notification.update({ is_read: !notification.is_read });
            res.status(200).json(notification);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    markAllAsRead: async (req, res) => {
        try {
            await Notification.update({ is_read: true }, {
                where: { is_read: false }
            });
            res.status(200).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = notificationController;
