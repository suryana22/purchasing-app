const ItemType = require('../models/ItemType');
const createController = require('./factory');

module.exports = createController(ItemType, 'item_types');
