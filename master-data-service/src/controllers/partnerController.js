const Partner = require('../models/Partner');
const createController = require('./factory');

module.exports = createController(Partner, 'partners');
