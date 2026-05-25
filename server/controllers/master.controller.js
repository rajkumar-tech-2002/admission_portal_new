const Master = require('../models/master.model');

exports.getAllMasterData = async (req, res, next) => {
    try {
        const departments = await Master.getAllDepartments();
        const studies = await Master.getAllStudies();
        const communities = await Master.getAllCommunities();
        const admissionTypes = await Master.getAllAdmissionTypes();
        const referenceTypes = await Master.getAllReferenceTypes();
        const admissionStatuses = await Master.getAllAdmissionStatuses();

        // New 10 Master Tables
        const districts = await Master.getAllFromTable('district_master');
        const schools = await Master.getAllFromTable('school_master');
        const consultancies = await Master.getAllFromTable('consultancy_master');
        const staff = await Master.getAllFromTable('staff_master');
        const annualIncome = await Master.getAllFromTable('annual_income_master');
        const religions = await Master.getAllFromTable('religion_master');
        const schoolTypes = await Master.getAllFromTable('school_type_master');
        const admissionYears = await Master.getAllFromTable('admission_year_master');
        const groups12th = await Master.getAllFromTable('group_in_12th_master');
        const roles = await Master.getAllFromTable('role_master');
        const courseFeeStructure = await Master.getAllFromTable('course_fee_structure');
        const institutions = await Master.getAllFromTable('institution_master');

        res.status(200).json({
            success: true,
            data: {
                departments,
                studies,
                communities,
                admissionTypes,
                referenceTypes,
                admissionStatuses,
                districts,
                schools,
                consultancies,
                staff,
                annualIncome,
                religions,
                schoolTypes,
                admissionYears,
                groups12th,
                roles,
                courseFeeStructure,
                institutions,
                validDate: await Master.getValidDate()
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.createData = async (req, res, next) => {
    try {
        const { table } = req.params;
        const id = await Master.create(table, req.body);
        res.status(201).json({ success: true, message: 'Data added successfully', id });
    } catch (error) {
        next(error);
    }
};

exports.updateData = async (req, res, next) => {
    try {
        const { table, id } = req.params;
        const success = await Master.update(table, id, req.body);
        if (success) {
            res.status(200).json({ success: true, message: 'Data updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Data not found' });
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteData = async (req, res, next) => {
    try {
        const { table, id } = req.params;
        const success = await Master.delete(table, id);
        if (success) {
            res.status(200).json({ success: true, message: 'Data deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Data not found' });
        }
    } catch (error) {
        next(error);
    }
};

exports.getEmailLogs = async (req, res, next) => {
    try {
        const { search } = req.query;
        const logs = await Master.getEmailLogs(search);
        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error) {
        next(error);
    }
};
