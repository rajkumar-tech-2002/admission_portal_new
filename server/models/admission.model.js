const db = require('../config/db.config');

class Admission {
    static async getAdmittedStudents() {
        const [rows] = await db.execute(`
            SELECT id, reg_id, reg_no_12th, std_name, std_dob, aadhaar_no, 
                   std_mobile_no, community, admission_quota, reference_type, 
                   reference_name, reference_dept, reference_institution, 
                   reference_contact_no, city, selected_dept, selected_course
            FROM record_master
            ORDER BY std_name ASC
        `);
        return rows;
    }

    // WHERE admission_status = 'Admitted'
    static async getStaffInstitutions() {
        const [rows] = await db.execute(`
            SELECT DISTINCT staff_institution 
            FROM staff_master 
            WHERE staff_institution IS NOT NULL AND staff_institution != ''
            ORDER BY staff_institution ASC
        `);
        return rows;
    }

    static async getStaffDepartments(institution) {
        const [rows] = await db.execute(`
            SELECT DISTINCT staff_department 
            FROM staff_master 
            WHERE staff_institution = ? AND staff_department IS NOT NULL AND staff_department != ''
            ORDER BY staff_department ASC
        `, [institution]);
        return rows;
    }

    static async getStaffMembers(institution, department) {
        const [rows] = await db.execute(`
            SELECT staff_name, staff_phone 
            FROM staff_master 
            WHERE staff_institution = ? AND staff_department = ? AND staff_name IS NOT NULL AND staff_name != ''
            ORDER BY staff_name ASC
        `, [institution, department]);
        return rows;
    }

    static async getConsultancies() {
        const [rows] = await db.execute(`
            SELECT DISTINCT consultancy_name, consultancy_person_name, consultancy_mobile 
            FROM consultancy_master
            WHERE consultancy_name IS NOT NULL AND consultancy_name != ''
            ORDER BY consultancy_name ASC
        `);
        return rows;
    }

    static async createAdmission(data) {
        const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;

        // Auto-generate application_no: APPYYYYXXXX (e.g., APP20260001)
        const now = new Date();
        const currentYear = now.getFullYear().toString();
        const [countRows] = await db.execute(
            `SELECT COUNT(*) AS cnt FROM student_admission_master WHERE YEAR(created_at) = YEAR(CURDATE())`
        );
        const seq = (countRows[0].cnt || 0) + 1;
        const applicationNo = `APP${currentYear}${String(seq).padStart(4, '0')}`;

        // Auto determine is_10th
        const has10th = data.tenthSchool || data.tenthMark || data.regNo10th;
        const is10th = has10th ? 'Yes' : 'No';

        // Auto determine is_12th
        const has12th = data.twelfthSchool || data.twelfthGroup || data.totalMarks12th;
        const is12th = has12th ? 'Yes' : 'No';

        const sql = `
            INSERT INTO student_admission_master (
                application_no, reg_no_12th, student_name, dob, college, admission_date, department, admission_year, quota,
                first_graduate, student_status, remark, aadhaar_no, school_type, fee, reference_remark,
                reference_amount_1, reference_paid_amount, community, father_name, mother_name, father_mobile_no,
                student_mobile_no, mother_mobile_no, father_occupation, father_annual_income, religion, caste_name,
                gender, student_email, address_1, address_2, pincode, country, state, district, city,
                is_10th, school_10th_district, school_10th_city, school_10th_name, mark_10th, reg_no_10th,
                total_marks_10th, percentage_10th, yop_10th, is_12th, school_12th_district, school_12th_city,
                school_12th_name, mark_sheet_given_status, yop_12th, group_in_12th,
                subject_1_name, subject_1_mark, subject_2_name, subject_2_mark, subject_3_name, subject_3_mark,
                subject_4_name, subject_4_mark, subject_5_name, subject_5_mark, subject_6_name, subject_6_mark,
                total_marks_12th, percentage_12th, ug_university, reference_type, reference_college,
                reference_department, reference_by_name, reference_by_mobile, consultancy_name,
                consultancy_person_name, consultancy_mobile, course_studied, studied_medium, board_university, nativity
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?
            )
        `;

        const values = [
            applicationNo,
            toNull(data.twelfthRegNo),
            toNull(data.studentName),
            toNull(data.dob),
            toNull(data.college),
            toNull(data.admissionDate),
            toNull(data.department),
            toNull(data.year),
            toNull(data.quota),
            toNull(data.firstGraduate),
            toNull(data.status),
            toNull(data.remark),
            toNull(data.aadharNo),
            toNull(data.schoolType),
            toNull(data.fee),
            toNull(data.rRemark),
            toNull(data.referenceAmount1),
            toNull(data.rPaidAmount),
            toNull(data.community),
            toNull(data.fatherName),
            toNull(data.motherName),
            toNull(data.fatherMobile),
            toNull(data.studentMobile),
            toNull(data.motherMobile),
            toNull(data.fatherOccupation),
            toNull(data.fatherAnnualIncome),
            toNull(data.religion),
            toNull(data.casteName),
            toNull(data.gender),
            toNull(data.studentEmail),
            toNull(data.address1),
            toNull(data.address2),
            toNull(data.pincode),
            toNull(data.country),
            toNull(data.state),
            toNull(data.district),
            toNull(data.city),
            is10th,
            toNull(data.tenthSchoolDistrict),
            toNull(data.tenthSchoolCity),
            toNull(data.tenthSchool),
            toNull(data.tenthMark),
            toNull(data.regNo10th),
            toNull(data.totalMarks10th),
            toNull(data.percentage10th),
            toNull(data.tenthYOP),
            is12th,
            toNull(data.twelfthSchoolDistrict),
            toNull(data.twelfthSchoolCity),
            toNull(data.twelfthSchool),
            toNull(data.twelfthMarkSheetStatus),
            toNull(data.twelfthYOP),
            toNull(data.twelfthGroup),
            toNull(data.subject1Name),
            toNull(data.subject1Mark),
            toNull(data.subject2Name),
            toNull(data.englishMark),
            toNull(data.subject3Name),
            toNull(data.subject2Mark),
            toNull(data.subject4Name),
            toNull(data.subject3Mark),
            toNull(data.subject5Name),
            toNull(data.subject4Mark),
            toNull(data.subject6Name),
            toNull(data.subject5Mark),
            toNull(data.totalMarks12th),
            toNull(data.percentage12th),
            toNull(data.ugUniversity),
            toNull(data.referenceType),
            toNull(data.referenceCollege),
            toNull(data.referenceDepartment),
            toNull(data.referenceByName),
            toNull(data.referenceByMobile),
            toNull(data.consultancyName),
            toNull(data.consultancyPersonName),
            toNull(data.consultancyMobile),
            toNull(data.courseStudied),
            toNull(data.medium),
            toNull(data.boardUniversity),
            toNull(data.nativity)
        ];

        const [result] = await db.execute(sql, values);
        return { insertId: result.insertId, applicationNo };
    }

    
    static async updateAdmission(id, data) {
        const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;
        
        const has10th = data.tenthSchool || data.tenthMark || data.regNo10th;
        const is10th = has10th ? 'Yes' : 'No';

        const has12th = data.twelfthSchool || data.twelfthGroup || data.totalMarks12th;
        const is12th = has12th ? 'Yes' : 'No';

        const sql = `
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
        `;

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

    static async getAdmissions() {
        const [rows] = await db.execute(`
            SELECT * FROM student_admission_master 
            ORDER BY created_at DESC
        `);
        return rows;
    }
    static async getCertificates() {
        const [rows] = await db.execute(`
            SELECT 
                sam.id as student_id, sam.application_no, sam.student_name, sam.college, sam.department,
                cgd.id as cert_id,
                cgd.tenth_marksheet, cgd.eleventh_marksheet, cgd.twelfth_marksheet,
                cgd.transfer_certificate, cgd.community_certificate, cgd.first_graduate_certificate,
                cgd.income_certificate, cgd.native_certificate, cgd.bonafide_certificate, cgd.remarks
            FROM student_admission_master sam
            LEFT JOIN certificate_given_details cgd ON sam.id = cgd.student_id
            ORDER BY sam.created_at DESC
        `);
        return rows;
    }

    static async saveCertificate(data) {
        const {
            student_id, student_application_no,
            tenth_marksheet, eleventh_marksheet, twelfth_marksheet,
            transfer_certificate, community_certificate, first_graduate_certificate,
            income_certificate, native_certificate, bonafide_certificate, remarks
        } = data;

        const [existing] = await db.execute('SELECT id FROM certificate_given_details WHERE student_id = ?', [student_id]);
        
        if (existing.length > 0) {
            const sql = `
                UPDATE certificate_given_details SET
                    tenth_marksheet = ?, eleventh_marksheet = ?, twelfth_marksheet = ?,
                    transfer_certificate = ?, community_certificate = ?, first_graduate_certificate = ?,
                    income_certificate = ?, native_certificate = ?, bonafide_certificate = ?, remarks = ?
                WHERE student_id = ?
            `;
            await db.execute(sql, [
                tenth_marksheet || null, eleventh_marksheet || null, twelfth_marksheet || null,
                transfer_certificate || null, community_certificate || null, first_graduate_certificate || null,
                income_certificate || null, native_certificate || null, bonafide_certificate || null, remarks || null,
                student_id
            ]);
            return { action: 'updated', id: existing[0].id };
        } else {
            const sql = `
                INSERT INTO certificate_given_details (
                    student_id, student_application_no,
                    tenth_marksheet, eleventh_marksheet, twelfth_marksheet,
                    transfer_certificate, community_certificate, first_graduate_certificate,
                    income_certificate, native_certificate, bonafide_certificate, remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.execute(sql, [
                student_id, student_application_no,
                tenth_marksheet || null, eleventh_marksheet || null, twelfth_marksheet || null,
                transfer_certificate || null, community_certificate || null, first_graduate_certificate || null,
                income_certificate || null, native_certificate || null, bonafide_certificate || null, remarks || null
            ]);
            return { action: 'inserted', id: result.insertId };
        }
    }

    static async deleteCertificate(cert_id) {
        await db.execute('DELETE FROM certificate_given_details WHERE id = ?', [cert_id]);
    }
    static async getFeesStudents(college, department, year) {
        let sql = `SELECT id, application_no, student_name, admission_date FROM student_admission_master WHERE 1=1`;
        const params = [];

        if (college) {
            sql += ` AND college = ?`;
            params.push(college);
        }
        if (department) {
            sql += ` AND department = ?`;
            params.push(department);
        }
        if (year) {
            sql += ` AND admission_year = ?`;
            params.push(year);
        }
        
        sql += ` ORDER BY student_name ASC`;
        const [rows] = await db.execute(sql, params);
        return rows;
    }

    static async saveFee(data) {
        const sql = `
            INSERT INTO student_fees_details (
                college, department, year_type, student_application_no, student_name, paid_date, paid_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.college || null,
            data.department || null,
            data.year_type || null,
            data.student_application_no || null,
            data.student_name || null,
            data.paid_date || null,
            data.paid_amount || null
        ];
        
        const [result] = await db.execute(sql, values);
        return result.insertId;
    }
    static async getAllFees() {
        const [rows] = await db.execute(`
            SELECT * FROM student_fees_details ORDER BY created_at DESC
        `);
        return rows;
    }
    static async deleteFee(id) {
        const [result] = await db.execute('DELETE FROM student_fees_details WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async importAdmissions(records) {
        if (!records || records.length === 0) return { imported: 0 };
        
        let imported = 0;
        const columns = [
            'application_no', 'reg_no_12th', 'student_name', 'dob', 'college', 'admission_date', 'department', 'admission_year', 'quota',
            'first_graduate', 'student_status', 'remark', 'aadhaar_no', 'school_type', 'fee', 'reference_remark',
            'reference_amount_1', 'reference_paid_amount', 'community', 'father_name', 'mother_name', 'father_mobile_no',
            'student_mobile_no', 'mother_mobile_no', 'father_occupation', 'father_annual_income', 'religion', 'caste_name',
            'gender', 'student_email', 'address_1', 'address_2', 'pincode', 'country', 'state', 'district', 'city',
            'is_10th', 'school_10th_district', 'school_10th_city', 'school_10th_name', 'mark_10th', 'reg_no_10th',
            'total_marks_10th', 'percentage_10th', 'yop_10th', 'is_12th', 'school_12th_district', 'school_12th_city',
            'school_12th_name', 'mark_sheet_given_status', 'yop_12th', 'group_in_12th',
            'subject_1_name', 'subject_1_mark', 'subject_2_name', 'subject_2_mark', 'subject_3_name', 'subject_3_mark',
            'subject_4_name', 'subject_4_mark', 'subject_5_name', 'subject_5_mark', 'subject_6_name', 'subject_6_mark',
            'total_marks_12th', 'percentage_12th', 'ug_university', 'reference_type', 'reference_college',
            'reference_department', 'reference_by_name', 'reference_by_mobile', 'consultancy_name',
            'consultancy_person_name', 'consultancy_mobile', 'course_studied', 'studied_medium', 'board_university', 'nativity'
        ];

        for (const record of records) {
            // Determine application_no
            let applicationNo = record.application_no;
            if (!applicationNo) {
                const now = new Date();
                const currentYear = now.getFullYear().toString();
                const [countRows] = await db.execute(
                    `SELECT COUNT(*) AS cnt FROM student_admission_master WHERE YEAR(created_at) = YEAR(CURDATE())`
                );
                const seq = (countRows[0].cnt || 0) + 1;
                applicationNo = `APP${currentYear}${String(seq).padStart(4, '0')}`;
            }

            // Check if exists
            const [existing] = await db.execute(`SELECT id FROM student_admission_master WHERE application_no = ?`, [applicationNo]);

            const vals = columns.map(c => record[c] !== undefined && record[c] !== '' ? record[c] : null);
            // application_no is always the first one
            vals[0] = applicationNo;

            if (existing.length > 0) {
                const updateCols = columns.map(c => `${c} = ?`).join(', ');
                await db.execute(`UPDATE student_admission_master SET ${updateCols} WHERE application_no = ?`, [...vals, applicationNo]);
            } else {
                const placeholders = columns.map(() => '?').join(', ');
                await db.execute(`INSERT INTO student_admission_master (${columns.join(', ')}) VALUES (${placeholders})`, vals);
            }
            imported++;
        }
        return { imported };
    }
}

module.exports = Admission;
