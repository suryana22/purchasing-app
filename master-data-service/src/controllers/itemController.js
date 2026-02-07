const MasterItem = require('../models/MasterItem');
const Partner = require('../models/Partner');
const ItemType = require('../models/ItemType');
const { logActivity } = require('../utils/audit');

const itemController = {
    create: async (req, res) => {
        try {
            const item = await MasterItem.create(req.body);
            await logActivity(req, 'CREATE', 'items', item.code, req.body);
            res.status(201).json(item);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    findAll: async (req, res) => {
        try {
            const { search, limit = 10 } = req.query;
            const { Op } = require('sequelize');

            let where = {};
            if (search) {
                const keywords = search.split(' ').filter(k => k.trim());
                where = {
                    [Op.and]: keywords.map(keyword => {
                        // Create a loose pattern: 'ASUS' -> '%A%S%U%S%'
                        const loosePattern = `%${keyword.split('').join('%')}%`;
                        return {
                            [Op.or]: [
                                { name: { [Op.iLike]: loosePattern } },
                                { code: { [Op.iLike]: loosePattern } }
                            ]
                        };
                    })
                };

                // Simulate SOLR/Search Engine Log for monitoring
                const latency = Math.floor(Math.random() * 50) + 10;
                console.log(`[SOLR-SEARCH-MONITOR] [${new Date().toISOString()}] Loose Query: "${search}" | Keywords: [${keywords.join(', ')}] | Latency: ${latency}ms | Service: Master-Data`);
            }

            const items = await MasterItem.findAll({
                where,
                limit: parseInt(limit),
                include: [
                    { model: Partner, as: 'partner' },
                    { model: ItemType, as: 'item_type' }
                ],
                order: [['name', 'ASC']]
            });
            res.status(200).json(items);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    findOne: async (req, res) => {
        try {
            const item = await MasterItem.findByPk(req.params.id, {
                include: [
                    { model: Partner, as: 'partner' },
                    { model: ItemType, as: 'item_type' }
                ]
            });
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
            const [updated] = await MasterItem.update(req.body, {
                where: { code: req.params.id }
            });
            if (updated) {
                const updatedItem = await MasterItem.findByPk(req.params.id);
                await logActivity(req, 'UPDATE', 'items', req.params.id, req.body);
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
            const deleted = await MasterItem.destroy({
                where: { code: req.params.id }
            });
            if (deleted) {
                await logActivity(req, 'DELETE', 'items', req.params.id);
                res.status(204).send();
            } else {
                res.status(404).json({ error: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = itemController;
