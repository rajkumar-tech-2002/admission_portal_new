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
            twelfthMarkSheetStatus: '12th Marksheet Given Status',
            twelfthGroup: '12th Group'
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

        const insertId = await Admission.createAdmission(data);
        res.status(201).json({
            success: true,
            message: 'Admission record saved successfully in student_admission_master!',
            id: insertId
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
