const CompanySetting = require('../models/CompanySetting');
const createController = require('./factory');

module.exports = createController(CompanySetting, 'companies');
