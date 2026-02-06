const { logActivity } = require('../utils/audit');

const createController = (Model, moduleName) => ({
    create: async (req, res) => {
        try {
            const item = await Model.create(req.body);
            await logActivity(req, 'CREATE', moduleName || Model.name, item.id, req.body);
            res.status(201).json(item);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    findAll: async (req, res) => {
        try {
            const items = await Model.findAll();
            res.status(200).json(items);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    findOne: async (req, res) => {
        try {
            const item = await Model.findByPk(req.params.id);
            if (item) {
                res.status(200).json(item);
            } else {
                res.status(404).json({ error: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const [updated] = await Model.update(req.body, {
                where: { id: req.params.id }
            });
            if (updated) {
                const updatedItem = await Model.findByPk(req.params.id);
                await logActivity(req, 'UPDATE', moduleName || Model.name, req.params.id, req.body);
                res.status(200).json(updatedItem);
            } else {
                res.status(404).json({ error: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const deleted = await Model.destroy({
                where: { id: req.params.id }
            });
            if (deleted) {
                await logActivity(req, 'DELETE', moduleName || Model.name, req.params.id);
                res.status(204).send();
            } else {
                res.status(404).json({ error: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
});

module.exports = createController;
