const express = require('express');
const router = express.Router();
const consolidateReportController = require('../controllers/consolidateReport.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get all consolidate report data with optional filters
router.get('/', authMiddleware, consolidateReportController.getConsolidateReport);

// Get distinct filter values (institutions & departments)
router.get('/filters', authMiddleware, consolidateReportController.getConsolidateFilters);

module.exports = router;
