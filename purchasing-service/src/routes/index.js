const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../config/auth');

// Protect all routes
router.use(authenticateToken);

router.get('/orders/count', orderController.count);
router.post('/orders', orderController.create);
router.get('/orders', orderController.findAll);
router.get('/orders/:id', orderController.findOne);
router.put('/orders/:id', orderController.update);
router.delete('/orders/:id', orderController.delete);
router.post('/orders/:id/approve', orderController.approve);
router.post('/orders/:id/track', orderController.trackOrder);
router.post('/orders/:id/create-manpro', orderController.createManproIssue);

const notificationController = require('../controllers/notificationController');
router.get('/notifications', notificationController.findAll);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.put('/notifications/:id/read', notificationController.markAsRead);

const orderAnalysisController = require('../controllers/orderAnalysisController');
router.post('/order-analyses', orderAnalysisController.create);
router.get('/orders/:orderId/analysis', orderAnalysisController.findByOrderId);

// Manpro Session Management
router.post('/manpro/session/start', orderController.startManproSession);
router.post('/manpro/session/stop', orderController.stopManproSession);
router.get('/manpro/status', orderController.getManproStatus);

module.exports = router;
