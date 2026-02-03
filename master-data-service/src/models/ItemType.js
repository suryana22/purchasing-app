const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemType = sequelize.define('item_types', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    prefix: {
        type: DataTypes.STRING(10),
        allowNull: false,
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

module.exports = ItemType;
