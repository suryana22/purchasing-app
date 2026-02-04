const { Op } = require('sequelize');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderAnalysis = require('../models/OrderAnalysis');
const { logActivity } = require('../utils/audit');
const Notification = require('../models/Notification');

module.exports = {
    create: async (req, res) => {
        try {
            const { items, ...orderData } = req.body;

            // Generate order number: PO-YYYYMMDD-XXX
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const dateStr = `${year}${month}${day}`;

            // Find the latest order number for today
            const latestOrder = await Order.findOne({
                where: {
                    order_number: {
                        [Op.iLike]: `PO-${dateStr}-%`
                    }
                },
                order: [['order_number', 'DESC']],
                paranoid: false // Check even deleted ones to be safe
            });

            console.log(`Generating PO for ${dateStr}. Latest found:`, latestOrder ? latestOrder.order_number : 'None');

            let nextNumber = 1;
            if (latestOrder) {
                const parts = latestOrder.order_number.split('-');
                const lastSeq = parseInt(parts[parts.length - 1]);
                if (!isNaN(lastSeq)) {
                    nextNumber = lastSeq + 1;
                }
            }

            const orderNumber = `PO-${dateStr}-${String(nextNumber).padStart(3, '0')}`;
            console.log(`Selected order number: ${orderNumber}`);

            const order = await Order.create({
                ...orderData,
                order_number: orderNumber
            });

            if (items && items.length > 0) {
                const orderItems = items.map(item => ({
                    ...item,
                    order_id: order.id
                }));
                await OrderItem.bulkCreate(orderItems);
            }

            const createdOrder = await Order.findByPk(order.id, {
                include: [OrderItem]
            });

            await logActivity(req, 'CREATE', 'Order', createdOrder.order_number, req.body);

            // Create Notification
            await Notification.create({
                message: `New Order Created: ${createdOrder.order_number}`,
                resource_type: 'Order',
                resource_id: createdOrder.id,
                action_type: 'CREATED',
                target_permission: 'orders.approve'
            });

            res.status(201).json(createdOrder);
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    },

    findAll: async (req, res) => {
        try {
            const orders = await Order.findAll({
                include: [OrderItem, { model: OrderAnalysis, as: 'Analysis' }]
            });
            res.status(200).json(orders);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    findOne: async (req, res) => {
        try {
            const order = await Order.findByPk(req.params.id, {
                include: [OrderItem, { model: OrderAnalysis, as: 'Analysis' }]
            });
            if (order) {
                res.status(200).json(order);
            } else {
                res.status(404).json({ error: 'Order not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const { items, ...orderData } = req.body;
            const targetOrder = await Order.findByPk(req.params.id);
            if (!targetOrder) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Lock editing if not draft, unless administrator
            // Special case: allow updating manpro_url even if not DRAFT
            const userRole = req.user.role ? req.user.role.toLowerCase() : '';
            const isJustManproUrl = Object.keys(orderData).length === 1 && orderData.manpro_url !== undefined;

            if (targetOrder.status !== 'DRAFT' && userRole !== 'administrator' && !isJustManproUrl) {
                return res.status(400).json({ error: `Cannot edit order because it is already ${targetOrder.status}` });
            }

            await Order.update(orderData, {
                where: { id: req.params.id }
            });

            if (items && items.length > 0 && (targetOrder.status === 'DRAFT' || userRole === 'administrator')) {
                // For simplicity, we delete existing items and recreate
                await OrderItem.destroy({ where: { order_id: req.params.id } });
                const orderItems = items.map(item => ({
                    ...item,
                    order_id: req.params.id
                }));
                await OrderItem.bulkCreate(orderItems);
            }

            const updatedOrder = await Order.findByPk(req.params.id, {
                include: [OrderItem]
            });

            await logActivity(req, 'UPDATE', 'Order', updatedOrder.order_number, req.body);
            res.status(200).json(updatedOrder);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const order = await Order.findByPk(req.params.id);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Lock deletion if not draft, unless administrator
            const userRole = req.user.role ? req.user.role.toLowerCase() : '';
            if (order.status !== 'DRAFT' && userRole !== 'administrator') {
                return res.status(400).json({ error: `Cannot delete order because it is already ${order.status}` });
            }

            await Order.destroy({ where: { id: req.params.id } });
            await logActivity(req, 'DELETE', 'Order', order.order_number);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    approve: async (req, res) => {
        try {
            const { status } = req.body;
            const validStatuses = ['APPROVED', 'REJECTED', 'PENDING'];
            const targetStatus = status ? status.toUpperCase() : 'APPROVED';

            if (!validStatuses.includes(targetStatus)) {
                return res.status(400).json({ error: 'Invalid status. Must be APPROVED, REJECTED, or PENDING.' });
            }

            const order = await Order.findByPk(req.params.id);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Allow moving back to pending from approved/rejected if administrator
            const userRole = req.user.role ? req.user.role.toLowerCase() : '';
            if (order.status !== 'DRAFT' && order.status !== 'PENDING' && userRole !== 'administrator') {
                return res.status(400).json({ error: `Order is already ${order.status}` });
            }

            await order.update({
                status: targetStatus,
                approved_by: targetStatus === 'APPROVED' ? req.user.id : order.approved_by,
                approval_date: targetStatus === 'APPROVED' ? new Date() : order.approval_date
            });

            await logActivity(req, targetStatus, 'Order', order.order_number);

            // Create Notification about the decision
            await Notification.create({
                message: `Order ${order.order_number} ${targetStatus} by ${req.user.username}`,
                resource_type: 'Order',
                resource_id: order.id,
                action_type: targetStatus,
            });

            res.status(200).json(order);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};
