const { logActivity } = require('../utils/audit');
const solr = require('../utils/solr');
const { Op } = require('sequelize');

const createController = (Model, moduleName) => ({
    create: async (req, res) => {
        try {
            const item = await Model.create(req.body);
            await logActivity(req, 'CREATE', moduleName || Model.name, item.id, req.body);

            // Sync to Solr
            await solr.add(Model.tableName, item.toJSON());

            res.status(201).json(item);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    findAll: async (req, res) => {
        try {
            const { search } = req.query;
            let where = {};

            if (search) {
                // Try Solr Search first
                const solrDocs = await solr.search(Model.tableName, search);

                if (solrDocs !== null) {
                    // Solr is reachable and returned results (or empty)
                    if (solrDocs.length > 0) {
                        const ids = solrDocs.map(doc => doc.id);
                        where.id = ids;
                    } else {
                        // Solr returned no matches. Return empty immediately.
                        return res.status(200).json([]);
                    }
                } else {
                    // Solr failed (returned null), fallback to DB ILIKE (Postgres)
                    console.warn(`Fallback to DB search for ${Model.name}`);
                    where = {
                        [Op.or]: [
                            { name: { [Op.iLike]: `%${search}%` } },
                            // Add description if exists in model, but safer to stick to common fields or check attributes
                            ...(Model.rawAttributes.description ? [{ description: { [Op.iLike]: `%${search}%` } }] : []),
                            ...(Model.rawAttributes.code ? [{ code: { [Op.iLike]: `%${search}%` } }] : [])
                        ]
                    };
                }
            }

            const items = await Model.findAll({ where });
            res.status(200).json(items);
        } catch (error) {
            console.error('FindAll Error:', error);
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

                // Sync to Solr
                await solr.add(Model.tableName, updatedItem.toJSON());

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

                // Sync to Solr
                await solr.delete(Model.tableName, req.params.id);

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
