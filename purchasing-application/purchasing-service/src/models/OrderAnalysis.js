const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./Order');

const OrderAnalysis = sequelize.define('OrderAnalysis', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    order_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Order,
            key: 'id',
        },
        allowNull: false,
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    analysis_type: {
        type: DataTypes.STRING, // Using STRING to be more flexible, but user said "Analisa Kerusakan" or "Analisa Perbaikan"
        allowNull: false,
    },
    analysis: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_replacement: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    asset_purchase_year: {
        type: DataTypes.STRING(4),
        allowNull: true,
    },
    remaining_book_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    asset_document: {
        type: DataTypes.TEXT, // Store as Base64 or URL
        allowNull: true,
    },
    requester_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    details: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
    }
}, {
    timestamps: true,
});

// Since many models might defined associations, we'll do it here
Order.hasOne(OrderAnalysis, { foreignKey: 'order_id', as: 'Analysis' });
OrderAnalysis.belongsTo(Order, { foreignKey: 'order_id' });

module.exports = OrderAnalysis;
