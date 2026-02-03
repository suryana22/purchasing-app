const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SpecialMasterItem = sequelize.define('special_master_items', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
});

module.exports = SpecialMasterItem;
