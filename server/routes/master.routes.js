const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public route for form dropdowns
router.get('/', masterController.getAllMasterData);

// Admin route for Email Logs
router.get('/email-logs/all', authMiddleware, masterController.getEmailLogs);

// Admin routes for Master Module management
router.post('/:table', authMiddleware, masterController.createData);
router.put('/:table/:id', authMiddleware, masterController.updateData);
router.delete('/:table/:id', authMiddleware, masterController.deleteData);

module.exports = router;
