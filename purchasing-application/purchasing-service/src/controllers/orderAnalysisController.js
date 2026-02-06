const OrderAnalysis = require('../models/OrderAnalysis');
const Order = require('../models/Order');

module.exports = {
    create: async (req, res) => {
        try {
            const { order_id } = req.body;

            // Check if order exists
            const order = await Order.findByPk(order_id);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Check if analysis already exists
            const existingAnalysis = await OrderAnalysis.findOne({ where: { order_id } });

            if (existingAnalysis) {
                // Update existing
                await existingAnalysis.update(req.body);
                return res.status(200).json(existingAnalysis);
            }

            // Create new
            const analysis = await OrderAnalysis.create(req.body);
            res.status(201).json(analysis);
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    },

    findByOrderId: async (req, res) => {
        try {
            const analysis = await OrderAnalysis.findOne({
                where: { order_id: req.params.orderId }
            });
            if (analysis) {
                res.status(200).json(analysis);
            } else {
                res.status(404).json({ error: 'Analysis not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};
