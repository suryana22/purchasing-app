const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    order_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: true,
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    partner_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'DRAFT',
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    ppn: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    grand_total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    approval_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    manpro_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    manpro_current_position: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Suryana, Esa Setiawan, Eri Wijaya, Yulisar Khiat'
    },
    manpro_is_closed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    manpro_manual_status: {
        type: DataTypes.STRING, // 'PENDING_DIRECTOR', 'APPROVED_DIRECTOR'
        allowNull: true
    },
    manpro_post_approval_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    manpro_post_is_closed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'The user who created this order'
    }
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Order;
