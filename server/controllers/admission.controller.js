const Admission = require('../models/admission.model');

exports.getAdmittedStudents = async (req, res, next) => {
    try {
        const students = await Admission.getAdmittedStudents();
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        next(error);
    }
};

exports.getStaffInstitutions = async (req, res, next) => {
    try {
        const institutions = await Admission.getStaffInstitutions();
        res.status(200).json({ success: true, data: institutions.map(i => i.staff_institution) });
    } catch (error) {
        next(error);
    }
};

exports.getStaffDepartments = async (req, res, next) => {
    try {
        const { institution } = req.query;
        if (!institution) {
            return res.status(400).json({ success: false, message: 'Institution query param is required' });
        }
        const departments = await Admission.getStaffDepartments(institution);
        res.status(200).json({ success: true, data: departments.map(d => d.staff_department) });
    } catch (error) {
        next(error);
    }
};

exports.getStaffMembers = async (req, res, next) => {
    try {
        const { institution, department } = req.query;
        if (!institution || !department) {
            return res.status(400).json({ success: false, message: 'Institution and department query params are required' });
        }
        const members = await Admission.getStaffMembers(institution, department);
        res.status(200).json({ success: true, data: members });
    } catch (error) {
        next(error);
    }
};

exports.getConsultancies = async (req, res, next) => {
    try {
        const consultancies = await Admission.getConsultancies();
        res.status(200).json({ success: true, data: consultancies });
    } catch (error) {
        next(error);
    }
};

exports.getCourseFee = async (req, res, next) => {
    try {
        const { college, department, year, quota } = req.query;
        if (!college || !department || !year || !quota) {
            return res.status(400).json({ success: false, message: 'Missing parameters for fee fetch' });
        }
        const fee = await Admission.getCourseFee(college, department, year, quota);
        res.status(200).json({ success: true, data: fee });
    } catch (error) {
        next(error);
    }
};

exports.submitAdmission = async (req, res, next) => {
    try {
        const data = req.body;

        // Backend validation for mandatory fields
        const mandatoryMap = {
            twelfthRegNo: '12th Register Number',
            studentName: 'Student Name',
            dob: 'Date of Birth',
            college: 'College Name',
            admissionDate: 'Admission Date',
            department: 'Department',
            year: 'Admission Year',
            quota: 'Admission Quota',
            status: 'Admission Status',
            studentMobile: 'Student Mobile Number',
            gender: 'Gender',
            twelfthMarkSheetStatus: '12th Marksheet Given Status'
        };

        const missingFields = [];
        for (const [key, label] of Object.entries(mandatoryMap)) {
            if (!data[key] || data[key].toString().trim() === '') {
                missingFields.push(label);
            }
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Mandatory fields are missing.',
                missingFields: missingFields
            });
        }

        const result = await Admission.createAdmission(data);
        res.status(201).json({
            success: true,
            message: `Admission record saved successfully! Application No: ${result.applicationNo}`,
            id: result.insertId,
            applicationNo: result.applicationNo
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdmissions = async (req, res, next) => {
    try {
        const admissions = await Admission.getAdmissions();
        res.status(200).json({ success: true, data: admissions });
    } catch (error) {
        next(error);
    }
};

exports.updateAdmission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        // Validation logic can be added here
        await Admission.updateAdmission(id, data);
        res.status(200).json({ success: true, message: 'Admission record updated successfully' });
    } catch (error) {
        next(error);
    }
};

exports.deleteAdmission = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Admission.deleteAdmission(id);
        res.status(200).json({ success: true, message: 'Admission record deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getCertificates = async (req, res, next) => {
    try {
        const certificates = await Admission.getCertificates();
        res.status(200).json({ success: true, data: certificates });
    } catch (error) {
        next(error);
    }
};

exports.saveCertificate = async (req, res, next) => {
    try {
        const data = req.body;
        if (!data.student_id) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }
        const result = await Admission.saveCertificate(data);
        res.status(200).json({ success: true, message: 'Certificate details saved successfully', result });
    } catch (error) {
        next(error);
    }
};

exports.deleteCertificate = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Admission.deleteCertificate(id);
        res.status(200).json({ success: true, message: 'Certificate record deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getFeesStudents = async (req, res, next) => {
    try {
        const { college, department, year } = req.query;
        const students = await Admission.getFeesStudents(college, department, year);
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        next(error);
    }
};

exports.saveFee = async (req, res, next) => {
    try {
        const data = req.body;
        if (!data.student_application_no || !data.paid_amount || !data.paid_date) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }
        const insertId = await Admission.saveFee(data);
        res.status(200).json({ success: true, message: 'Fee record saved successfully', id: insertId });
    } catch (error) {
        next(error);
    }
};

exports.getAllFees = async (req, res, next) => {
    try {
        const fees = await Admission.getAllFees();
        res.status(200).json({ success: true, data: fees });
    } catch (error) {
        next(error);
    }
};

exports.deleteFee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const success = await Admission.deleteFee(id);
        if (success) {
            res.status(200).json({ success: true, message: 'Fee deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Fee not found' });
        }
    } catch (error) {
        next(error);
    }
};

exports.importAdmissions = async (req, res, next) => {
    try {
        const { records } = req.body;
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: 'Invalid records format' });
        }
        const result = await Admission.importAdmissions(records);
        res.status(200).json({ success: true, message: 'Records imported successfully', result });
    } catch (error) {
        next(error);
    }
};
