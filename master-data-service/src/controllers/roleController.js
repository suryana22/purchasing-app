const Role = require('../models/Role');
const Permission = require('../models/Permission');
const createController = require('./factory');
const { logActivity } = require('../utils/audit');

const controller = createController(Role, 'roles');

// Includes Permission in fetches
controller.findAll = async (req, res) => {
    try {
        const items = await Role.findAll({ include: [Permission] });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

controller.create = async (req, res) => {
    try {
        const { permissionIds, ...roleData } = req.body;
        const role = await Role.create(roleData);
        if (permissionIds && permissionIds.length > 0) {
            await role.setPermissions(permissionIds);
        }
        await logActivity(req, 'CREATE', 'roles', role.id, req.body);
        const createdRole = await Role.findByPk(role.id, { include: [Permission] });
        res.status(201).json(createdRole);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

controller.update = async (req, res) => {
    try {
        const { permissionIds, ...roleData } = req.body;
        await Role.update(roleData, { where: { id: req.params.id } });
        const role = await Role.findByPk(req.params.id);
        if (role && permissionIds) {
            await role.setPermissions(permissionIds);
        }
        await logActivity(req, 'UPDATE', 'roles', req.params.id, req.body);
        const updatedRole = await Role.findByPk(req.params.id, { include: [Permission] });
        res.status(200).json(updatedRole);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = controller;
