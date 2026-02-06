const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Partner = require('./Partner');
const ItemType = require('./ItemType');

const MasterItem = sequelize.define('master_items', {
    code: { // Kode Barang as Primary Key
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    partner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Partner,
            key: 'id'
        }
    },
    item_type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: ItemType,
            key: 'id'
        }
    },
    price: { // Harga Sebelum PPN
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    vat_percentage: { // PPN (Persentase)
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    vat_amount: { // Nominal PPN
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    total_price: { // Harga Setelah PPN
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

MasterItem.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });
Partner.hasMany(MasterItem, { foreignKey: 'partner_id' });

MasterItem.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });
ItemType.hasMany(MasterItem, { foreignKey: 'item_type_id' });

module.exports = MasterItem;
