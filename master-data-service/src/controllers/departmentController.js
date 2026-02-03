const Department = require('../models/Department');
const createController = require('./factory');

module.exports = createController(Department, 'departments');
