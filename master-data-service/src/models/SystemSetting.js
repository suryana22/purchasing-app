const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    key: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
    }
}, {
    timestamps: true,
});

module.exports = SystemSetting;
