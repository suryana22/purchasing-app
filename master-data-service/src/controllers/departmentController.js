const Department = require('../models/Department');
const createController = require('./factory');

const controller = createController(Department, 'departments');

controller.count = async (req, res) => {
    try {
        const count = await Department.count();
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = controller;
