const User = require('../models/User');
const Role = require('../models/Role');
const createController = require('./factory');
const { logActivity } = require('../utils/audit');
const bcrypt = require('bcryptjs');

const controller = createController(User, 'users');

// Override create to hash password
controller.create = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        const item = await User.create(data);
        await logActivity(req, 'CREATE', 'users', item.id, { username: item.username, role_id: item.role_id });
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Override update to hash password if changed
controller.update = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        const [updated] = await User.update(data, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedItem = await User.findByPk(req.params.id);
            await logActivity(req, 'UPDATE', 'users', req.params.id, data);
            res.status(200).json(updatedItem);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Override to include Role
controller.findAll = async (req, res) => {
    try {
        const items = await User.findAll({ include: [Role] });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

controller.findOne = async (req, res) => {
    try {
        const item = await User.findByPk(req.params.id, { include: [Role] });
        if (item) res.status(200).json(item);
        else res.status(404).json({ error: 'User not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = controller;
