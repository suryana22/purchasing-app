const Partner = require('../models/Partner');
const createController = require('./factory');

const controller = createController(Partner, 'partners');

controller.count = async (req, res) => {
    try {
        const count = await Partner.count();
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = controller;
