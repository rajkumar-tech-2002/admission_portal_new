const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admission.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public or Protected Autocomplete Helpers
router.get('/admitted-students', authMiddleware, admissionController.getAdmittedStudents);
router.get('/staff-institutions', authMiddleware, admissionController.getStaffInstitutions);
router.get('/staff-departments', authMiddleware, admissionController.getStaffDepartments);
router.get('/staff-members', authMiddleware, admissionController.getStaffMembers);
router.get('/consultancies', authMiddleware, admissionController.getConsultancies);

// Admission Process Actions
router.post('/submit', authMiddleware, admissionController.submitAdmission);
router.get('/list', authMiddleware, admissionController.getAdmissions);

module.exports = router;
