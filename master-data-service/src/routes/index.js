const express = require('express');
const router = express.Router();
const { authenticateToken, checkPermission } = require('../config/auth');

const departmentController = require('../controllers/departmentController');
const itemController = require('../controllers/itemController');
const partnerController = require('../controllers/partnerController');
const userController = require('../controllers/userController');
const roleController = require('../controllers/roleController');
const permissionController = require('../controllers/permissionController');
const companyController = require('../controllers/companyController');
const authController = require('../controllers/authController');

// Helper to register routes for a controller
const registerRoutes = (path, controller, moduleName) => {
    const resourceRouter = express.Router();
    resourceRouter.post('/', authenticateToken, checkPermission(`${moduleName}.create`), controller.create);
    resourceRouter.get('/', authenticateToken, checkPermission(`${moduleName}.view`), controller.findAll);
    resourceRouter.get('/:id', authenticateToken, checkPermission(`${moduleName}.view`), controller.findOne);
    resourceRouter.put('/:id', authenticateToken, checkPermission(`${moduleName}.edit`), controller.update);
    resourceRouter.delete('/:id', authenticateToken, checkPermission(`${moduleName}.delete`), controller.delete);
    router.use(path, resourceRouter);
};

// Auth (Public)
router.post('/auth/login', authController.login);

// Protected Routes
registerRoutes('/departments', departmentController, 'departments');
registerRoutes('/items', itemController, 'items');
registerRoutes('/partners', partnerController, 'partners');
registerRoutes('/users', userController, 'users');
registerRoutes('/roles', roleController, 'roles');
registerRoutes('/permissions', permissionController, 'permissions');
registerRoutes('/companies', companyController, 'companies');
registerRoutes('/item-types', require('../controllers/itemTypeController'), 'item_types');
registerRoutes('/special-items', require('../controllers/specialItemController'), 'special_items');

// Logs (Protected)
router.use('/logs', require('./logRoutes'));



module.exports = router;

