const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanySetting = sequelize.define('CompanySetting', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    company_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    company_address: {
        type: DataTypes.TEXT,
    },
    company_logo: {
        type: DataTypes.TEXT, // Store as Base64 or URL
    },
    company_phone: {
        type: DataTypes.STRING,
    },
    company_email: {
        type: DataTypes.STRING,
    },
    direktur_utama: {
        type: DataTypes.STRING,
    },
    company_code: {
        type: DataTypes.STRING,
    }
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = CompanySetting;
