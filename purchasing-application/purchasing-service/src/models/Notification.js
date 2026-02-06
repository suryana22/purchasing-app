const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    resource_type: {
        type: DataTypes.STRING, // e.g., 'Order'
    },
    resource_id: {
        type: DataTypes.INTEGER,
    },
    action_type: {
        type: DataTypes.STRING, // e.g., 'CREATED', 'UPDATED'
    },
    target_permission: {
        type: DataTypes.STRING, // e.g., 'orders.approve'
        allowNull: true,
    },
    is_read: {
        type: DataTypes.BOOLEAN, // Note: This is a simplistic global read status for MVP.
        defaultValue: false,
    }
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Notification;
