const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderAnalysis = require('../models/OrderAnalysis');
const { logActivity } = require('../utils/audit');
const Notification = require('../models/Notification');
const scraper = require('../services/manproScraper');

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
                order_number: orderNumber,
                user_id: req.user.id
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
            const where = {};

            // Filter: Only Administrator and IT Support can see all orders
            const userRole = req.user.role ? req.user.role.toLowerCase() : '';
            if (userRole !== 'administrator' && userRole !== 'it support') {
                where.user_id = req.user.id;
            }

            const orders = await Order.findAll({
                where,
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

            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Authorization check
            const userRole = req.user.role ? req.user.role.toLowerCase() : '';
            if (userRole !== 'administrator' && userRole !== 'it support' && order.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied. You can only view your own orders.' });
            }

            res.status(200).json(order);
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

            // Lock editing if not draft, unless administrator/it support or if it's just a manpro tracking update
            // Whitelist for manpro tracking fields that can be updated anytime by authorized users
            const allowedFields = ['manpro_url', 'manpro_current_position', 'manpro_is_closed', 'manpro_manual_status', 'manpro_post_approval_url', 'manpro_post_is_closed'];
            const updates = Object.keys(orderData);
            const isJustManproUpdate = updates.length > 0 && updates.every(field => allowedFields.includes(field));

            console.log(`[Controller] Update request for order ${req.params.id}. Fields: ${updates.join(', ')}. isJustManproUpdate: ${isJustManproUpdate}`);

            // Authorization check
            const userRole = req.user.role ? req.user.role.toLowerCase() : '';
            const isApprover = userRole === 'approver' || (req.user.permissions && req.user.permissions.includes('orders.approve'));

            // Standard check: Only creator, admin, or it support can edit general fields
            if (!isJustManproUpdate && userRole !== 'administrator' && userRole !== 'it support' && targetOrder.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied. You can only edit your own orders.' });
            }

            // Manpro update check: Admins, IT Support, Creator, OR Approvers can update Manpro fields
            if (isJustManproUpdate && userRole !== 'administrator' && userRole !== 'it support' && targetOrder.user_id !== req.user.id && !isApprover) {
                return res.status(403).json({ error: 'Access denied. You do not have permission to update tracking info.' });
            }

            if (targetOrder.status !== 'DRAFT' && userRole !== 'administrator' && userRole !== 'it support' && !isJustManproUpdate) {
                return res.status(400).json({ error: `Cannot edit order because it is already ${targetOrder.status}` });
            }

            // If updating post_approval_url, we should reset its closed status
            if (orderData.manpro_post_approval_url && orderData.manpro_post_approval_url !== targetOrder.manpro_post_approval_url) {
                orderData.manpro_post_is_closed = false;
                console.log(`[Controller] Post-approval URL changed for order ${req.params.id}. Resetting post_is_closed.`);
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

            // Authorization check
            const userRole = req.user.role ? req.user.role.toLowerCase() : '';
            if (userRole !== 'administrator' && userRole !== 'it support' && order.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied. You can only delete your own orders.' });
            }

            // Lock deletion if not draft, unless administrator
            if (order.status !== 'DRAFT' && userRole !== 'administrator' && userRole !== 'it support') {
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
            if (order.status !== 'DRAFT' && order.status !== 'PENDING' && userRole !== 'administrator' && userRole !== 'it support') {
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
    },

    trackOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { manpro_url, username, password } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            if (!manpro_url) {
                return res.status(400).json({ error: 'Order does not have a Manpro URL linked' });
            }

            // Call Scraper Service
            const scraper = require('../services/manproScraper');
            let scraperUser = username;
            let scraperPass = password;

            // If credentials not provided, try to fetch from SystemSettings
            if (!scraperUser || !scraperPass) {
                console.log('[Controller] Credentials missing in request, fetching from SystemSettings...');
                try {
                    const [settings] = await sequelize.query(
                        'SELECT key, value FROM public."SystemSettings" WHERE key ILIKE \'%manpro_%\';'
                    );

                    if (settings && settings.length > 0) {
                        settings.forEach(s => {
                            if (s.key.toLowerCase() === 'manpro_username') scraperUser = s.value;
                            if (s.key.toLowerCase() === 'manpro_password') scraperPass = s.value;
                        });
                        console.log(`[Controller] Found ${settings.length} settings in DB. User: ${scraperUser ? 'YES' : 'NO'}`);
                    } else {
                        console.log('[Controller] No Manpro settings found in public."SystemSettings"');
                    }
                } catch (dbErr) {
                    console.error('[Controller] Failed to fetch credentials from DB:', dbErr.message);
                }
            }

            console.log(`[Controller] Using credentials: ${scraperUser ? scraperUser : 'NONE'} / ${scraperPass ? 'HIDDEN' : 'NONE'}`);
            console.log(`Tracking order ${id} at ${manpro_url}`);
            const result = await scraper.scrapeManproPosition(manpro_url, scraperUser, scraperPass);

            // Logic for manual status
            let manualStatus = order.manpro_manual_status || 'PENDING_DIRECTOR';

            if (result.manpro_is_canceled) {
                console.log(`[Controller] Scraper detected CANCELED status for order ${id}.`);
                manualStatus = 'CANCELLED';
                // Store reason in position field for display
                const reason = result.manpro_cancel_reason || 'Dibatalkan di Manpro';
                result.manpro_current_position = `Canceled by Manpro: ${reason}`;
            } else if (result.manpro_is_closed) {
                const approverNames = ['Yulisar Khiat', 'Disetujui', 'Selesai', 'Approved'];
                const currentPosLower = result.manpro_current_position ? result.manpro_current_position.toLowerCase() : '';

                if (approverNames.some(name => currentPosLower.includes(name.toLowerCase()))) {
                    console.log(`[Controller] Scraper detected CLOSED status and position ${result.manpro_current_position} for order ${id}. Marking as APPROVED_DIRECTOR.`);
                    manualStatus = 'APPROVED_DIRECTOR';
                }
            }

            // Track second link if it exists and first is already approved
            let postIsClosed = order.manpro_post_is_closed;
            let finalPosition = result.manpro_current_position;

            if (manualStatus === 'APPROVED_DIRECTOR' && order.manpro_post_approval_url) {
                console.log(`[Controller] First process closed. Now tracking post-approval: ${order.manpro_post_approval_url}`);
                try {
                    const postResult = await scraper.scrapeManproPosition(order.manpro_post_approval_url, scraperUser, scraperPass);
                    postIsClosed = postResult.manpro_is_closed;
                    // If we are in the second process, the current actor is from the second URL
                    if (postResult.manpro_current_position && postResult.manpro_current_position !== 'Pending') {
                        finalPosition = postResult.manpro_current_position;
                    }
                    console.log(`[Controller] Post-approval status - Closed: ${postIsClosed}, Position: ${finalPosition}`);
                } catch (postErr) {
                    console.error('[Controller] Failed to scrape post-approval URL:', postErr.message);
                }
            }

            // Update Order
            await order.update({
                manpro_current_position: finalPosition,
                manpro_is_closed: result.manpro_is_closed,
                manpro_manual_status: manualStatus,
                manpro_post_is_closed: postIsClosed
            });

            console.log(`[Controller] Order ${id} updated with status ${manualStatus} and position ${result.manpro_current_position}`);

            res.status(200).json(order);

        } catch (error) {
            console.error('Tracking Error:', error);
            res.status(500).json({ error: 'Failed to track order: ' + error.message });
        }
    },

    createManproIssue: async (req, res) => {
        const { id } = req.params;
        const { formData, username, password, dryRun } = req.body;

        try {
            const order = await Order.findByPk(id);
            if (!order) return res.status(404).json({ error: 'Order not found' });

            // 1. Get credentials (prioritize input, then env, then DB)
            let scraperUser = username || process.env.MANPRO_USERNAME;
            let scraperPass = password || process.env.MANPRO_PASSWORD;

            if (!scraperUser || !scraperPass) {
                try {
                    const dbAdmin = await sequelize.query(
                        "SELECT username, password FROM Admins WHERE role = 'administrator' LIMIT 1",
                        { type: sequelize.QueryTypes.SELECT }
                    );
                    if (dbAdmin && dbAdmin[0]) {
                        scraperUser = scraperUser || dbAdmin[0].username;
                        scraperPass = scraperPass || dbAdmin[0].password;
                    }
                } catch (dbErr) {
                    console.error('[Controller] Failed to fetch credentials for creation:', dbErr.message);
                }
            }

            if (!scraperUser || !scraperPass) {
                return res.status(400).json({ error: 'Manpro credentials are required to create a document.' });
            }

            // 2. Call scraper to create issue
            const result = await scraper.createManproIssue(formData, scraperUser, scraperPass, dryRun);

            if (result && result.url) {
                // 3. Update order with the new URL
                const updateData = {};

                // Only save URL to DB if it's NOT a dry run
                if (!dryRun && !result.isDryRun) {
                    updateData.manpro_url = result.url;
                    updateData.manpro_manual_status = 'PENDING_DIRECTOR';

                    await order.update(updateData);
                } else {
                    console.log(`[Controller] Dry Run finished. NOT saving URL to DB: ${result.url}`);
                    // Attach fake url for frontend feedback only
                    order.dataValues.manpro_url = result.url;
                }

                console.log(`[Controller] Created Manpro issue for order ${id}: ${result.url}`);
                res.status(200).json(order);
            } else {
                res.status(500).json({ error: 'Failed to extract URL from newly created Manpro issue' });
            }

        } catch (error) {
            console.error('Manpro Creation Error:', error);
            res.status(500).json({ error: 'Failed to create Manpro document: ' + error.message });
        }
    }
};
