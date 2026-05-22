const express = require('express');
const router = express.Router();
const recordController = require('../controllers/record.controller');
const authMiddleware = require('../middleware/auth.middleware');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Public route for submitting enquiry
router.post('/', upload.single('pdf'), recordController.createRecord);

// Protected route for admin datatable
router.get('/', authMiddleware, recordController.getRecords);

// Protected route for stats (must be before /:id)
router.get('/stats', authMiddleware, recordController.getStats);

// Protected route to get a single record by id
router.get('/:id', authMiddleware, recordController.getRecordById);

// Protected route to update status
router.put('/:id/status', authMiddleware, recordController.updateStatus);

// Protected route to send/resend email with optional PDF upload
router.post('/:id/send-email', authMiddleware, upload.single('pdf'), recordController.sendEmail);

// Public route to attach PDF and send email immediately after creation
router.post('/:id/public-email', upload.single('pdf'), recordController.sendEmail);

// Protected route to view PDF directly
router.get('/:id/pdf', authMiddleware, recordController.viewPdf);

module.exports = router;
