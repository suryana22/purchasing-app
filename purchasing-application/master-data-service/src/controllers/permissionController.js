const Permission = require('../models/Permission');
const createController = require('./factory');

module.exports = createController(Permission, 'permissions');
