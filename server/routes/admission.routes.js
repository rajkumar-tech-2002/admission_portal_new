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
router.get('/course-fee', authMiddleware, admissionController.getCourseFee);
router.get('/suggestions', authMiddleware, admissionController.getSuggestions);

// Admission Process Actions
router.post('/submit', authMiddleware, admissionController.submitAdmission);
router.post('/import', authMiddleware, admissionController.importAdmissions);
router.get('/list', authMiddleware, admissionController.getAdmissions);
router.get('/reports/fees-originals', authMiddleware, admissionController.getFeesOriginalsReport);
router.get('/reports/fees-originals-pg', authMiddleware, admissionController.getFeesOriginalsPGReport);
router.get('/reports/certificate-count', authMiddleware, admissionController.getCertificateCountReport);
router.get('/reports/certificate-count-pg', authMiddleware, admissionController.getCertificateCountPGReport);
router.put('/:id', authMiddleware, admissionController.updateAdmission);
router.delete('/:id', authMiddleware, admissionController.deleteAdmission);

// Certificate Actions
router.get('/certificates/list', authMiddleware, admissionController.getCertificates);
router.post('/certificates/save', authMiddleware, admissionController.saveCertificate);
router.delete('/certificates/:id', authMiddleware, admissionController.deleteCertificate);

router.get('/certificates-pg/list', authMiddleware, admissionController.getCertificatesPG);
router.post('/certificates-pg/save', authMiddleware, admissionController.saveCertificatePG);
router.delete('/certificates-pg/:id', authMiddleware, admissionController.deleteCertificatePG);

router.get('/certificates-npc/list', authMiddleware, admissionController.getCertificatesNPC);
router.post('/certificates-npc/save', authMiddleware, admissionController.saveCertificateNPC);
router.delete('/certificates-npc/:id', authMiddleware, admissionController.deleteCertificateNPC);

// Fees Actions
router.get('/fees-students', authMiddleware, admissionController.getFeesStudents);
router.post('/fees/save', authMiddleware, admissionController.saveFee);
router.get('/fees/list', authMiddleware, admissionController.getAllFees);
router.delete('/fees/:id', authMiddleware, admissionController.deleteFee);

// Concession Actions
router.post('/concessions/save', authMiddleware, admissionController.saveConcession);
router.get('/concessions/list', authMiddleware, admissionController.getAllConcessions);
router.delete('/concessions/:id', authMiddleware, admissionController.deleteConcession);

module.exports = router;
