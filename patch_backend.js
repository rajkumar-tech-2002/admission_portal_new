const fs = require('fs');
const path = require('path');

// 1. Patch admission.routes.js
const routesPath = path.join(__dirname, 'server', 'routes', 'admission.routes.js');
let routesContent = fs.readFileSync(routesPath, 'utf8');
if (!routesContent.includes('router.put(\'/:id\'')) {
    routesContent = routesContent.replace(
        "router.get('/list', authMiddleware, admissionController.getAdmissions);",
        "router.get('/list', authMiddleware, admissionController.getAdmissions);\nrouter.put('/:id', authMiddleware, admissionController.updateAdmission);\nrouter.delete('/:id', authMiddleware, admissionController.deleteAdmission);"
    );
    fs.writeFileSync(routesPath, routesContent);
    console.log('Routes patched');
}

// 2. Patch admission.controller.js
const ctrlPath = path.join(__dirname, 'server', 'controllers', 'admission.controller.js');
let ctrlContent = fs.readFileSync(ctrlPath, 'utf8');
if (!ctrlContent.includes('exports.updateAdmission =')) {
    ctrlContent += `
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
`;
    fs.writeFileSync(ctrlPath, ctrlContent);
    console.log('Controller patched');
}

// 3. Patch admission.model.js
const modelPath = path.join(__dirname, 'server', 'models', 'admission.model.js');
let modelContent = fs.readFileSync(modelPath, 'utf8');
if (!modelContent.includes('static async updateAdmission(')) {
    const updateFunc = `
    static async updateAdmission(id, data) {
        const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;
        
        const has10th = data.tenthSchool || data.tenthMark || data.regNo10th;
        const is10th = has10th ? 'Yes' : 'No';

        const has12th = data.twelfthSchool || data.twelfthGroup || data.totalMarks12th;
        const is12th = has12th ? 'Yes' : 'No';

        const sql = \`
            UPDATE student_admission_master SET
                reg_no_12th=?, student_name=?, dob=?, college=?, admission_date=?, department=?, admission_year=?, quota=?,
                first_graduate=?, student_status=?, remark=?, aadhaar_no=?, school_type=?, fee=?, reference_remark=?,
                reference_amount_1=?, reference_paid_amount=?, community=?, father_name=?, mother_name=?, father_mobile_no=?,
                student_mobile_no=?, mother_mobile_no=?, father_occupation=?, father_annual_income=?, religion=?, caste_name=?,
                gender=?, student_email=?, address_1=?, address_2=?, pincode=?, country=?, state=?, district=?, city=?,
                is_10th=?, school_10th_district=?, school_10th_city=?, school_10th_name=?, mark_10th=?, reg_no_10th=?,
                total_marks_10th=?, percentage_10th=?, yop_10th=?, is_12th=?, school_12th_district=?, school_12th_city=?,
                school_12th_name=?, mark_sheet_given_status=?, yop_12th=?, group_in_12th=?,
                subject_1_name=?, subject_1_mark=?, subject_2_name=?, subject_2_mark=?, subject_3_name=?, subject_3_mark=?,
                subject_4_name=?, subject_4_mark=?, subject_5_name=?, subject_5_mark=?, subject_6_name=?, subject_6_mark=?,
                total_marks_12th=?, percentage_12th=?, ug_university=?, reference_type=?, reference_college=?,
                reference_department=?, reference_by_name=?, reference_by_mobile=?, consultancy_name=?,
                consultancy_person_name=?, consultancy_mobile=?, course_studied=?, studied_medium=?, board_university=?, nativity=?
            WHERE id=?
        \`;

        const values = [
            toNull(data.twelfthRegNo), toNull(data.studentName), toNull(data.dob), toNull(data.college), toNull(data.admissionDate), toNull(data.department), toNull(data.year), toNull(data.quota),
            toNull(data.firstGraduate), toNull(data.status), toNull(data.remark), toNull(data.aadharNo), toNull(data.schoolType), toNull(data.fee), toNull(data.rRemark),
            toNull(data.referenceAmount1), toNull(data.rPaidAmount), toNull(data.community), toNull(data.fatherName), toNull(data.motherName), toNull(data.fatherMobile),
            toNull(data.studentMobile), toNull(data.motherMobile), toNull(data.fatherOccupation), toNull(data.fatherAnnualIncome), toNull(data.religion), toNull(data.casteName),
            toNull(data.gender), toNull(data.studentEmail), toNull(data.address1), toNull(data.address2), toNull(data.pincode), toNull(data.country), toNull(data.state), toNull(data.district), toNull(data.city),
            is10th, toNull(data.tenthSchoolDistrict), toNull(data.tenthSchoolCity), toNull(data.tenthSchool), toNull(data.tenthMark), toNull(data.regNo10th),
            toNull(data.totalMarks10th), toNull(data.percentage10th), toNull(data.tenthYOP), is12th, toNull(data.twelfthSchoolDistrict), toNull(data.twelfthSchoolCity),
            toNull(data.twelfthSchool), toNull(data.twelfthMarkSheetStatus), toNull(data.twelfthYOP), toNull(data.twelfthGroup),
            toNull(data.subject1Name), toNull(data.subject1Mark), toNull(data.subject2Name), toNull(data.englishMark), toNull(data.subject3Name), toNull(data.subject2Mark),
            toNull(data.subject4Name), toNull(data.subject3Mark), toNull(data.subject5Name), toNull(data.subject4Mark), toNull(data.subject6Name), toNull(data.subject5Mark),
            toNull(data.totalMarks12th), toNull(data.percentage12th), toNull(data.ugUniversity), toNull(data.referenceType), toNull(data.referenceCollege),
            toNull(data.referenceDepartment), toNull(data.referenceByName), toNull(data.referenceByMobile), toNull(data.consultancyName),
            toNull(data.consultancyPersonName), toNull(data.consultancyMobile), toNull(data.courseStudied), toNull(data.medium), toNull(data.boardUniversity), toNull(data.nativity),
            id
        ];

        await db.execute(sql, values);
    }

    static async deleteAdmission(id) {
        await db.execute('DELETE FROM student_admission_master WHERE id = ?', [id]);
    }
`;
    modelContent = modelContent.replace(
        'static async getAdmissions() {',
        `${updateFunc}\n    static async getAdmissions() {`
    );
    fs.writeFileSync(modelPath, modelContent);
    console.log('Model patched');
}
