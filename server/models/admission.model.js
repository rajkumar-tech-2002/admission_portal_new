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
            SELECT DISTINCT staff_department, staff_programme, staff_programme_type
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

   static async getCourseFee(college, department, programme, year, quota) {

    let mappedQuota = quota;

    if (quota === 'Government Quota') {
        mappedQuota = 'COUNSELLING';
    } else if (quota === 'Management Quota') {
        mappedQuota = 'MANAGEMENT';
    }
if (!programme || !programme.trim()) {
    console.log("Programme missing");
    return null;
}

throw new Error("NEW MODEL FILE RUNNING");

const sql = `
    SELECT fees
    FROM course_fee_structure
    WHERE TRIM(institution) = TRIM(?)
    AND TRIM(programme) = TRIM(?)
    AND TRIM(department) = TRIM(?)
    AND TRIM(year) = TRIM(?)
    AND TRIM(quota) = TRIM(?)
    LIMIT 1
`;

    const params = [
        college.trim(),
        programme.trim(),
        department.trim(),
        year.trim(),
        mappedQuota.trim()
    ];

    console.log("FEE PARAMS =>", params);

    const [rows] = await db.execute(sql, params);

    console.log("FEE RESULT =>", rows);

    return rows.length > 0 ? rows[0].fees : null;
}

    static async getSuggestions(field, query) {
        const allowedFields = ['city', 'address2', 'taluk', 'district', 'state', 'pincode', 'tenth_school_name', 'twelfth_school_name', 'tenth_school_city', 'twelfth_school_city', 'ug_college_name', 'reference_name', 'reference_institution', 'reference_dept'];
        if (!allowedFields.includes(field)) {
            throw new Error('Invalid field for suggestions');
        }

        // Map UI field names to actual database column names
        const fieldMap = {
            'address2': 'address_2',
            'tenth_school_name': 'school_10th_name',
            'twelfth_school_name': 'school_12th_name',
            'tenth_school_city': 'school_10th_city',
            'twelfth_school_city': 'school_12th_city',
            'ug_college_name': 'ug_college',
            'reference_name': 'reference_by_name',
            'reference_institution': 'reference_college',
            'reference_dept': 'reference_department'
        };

        const dbField = fieldMap[field] || field;

        const searchTerm = `%${query}%`;

        const sql = `
    SELECT DISTINCT ${dbField} as value
    FROM student_admission_master
    WHERE ${dbField} LIKE ?
      AND ${dbField} IS NOT NULL
      AND ${dbField} != ''
    ORDER BY ${dbField} ASC
    LIMIT 15
`;

        const [rows] = await db.execute(sql, [searchTerm]);

        return rows.map(r => r.value);
    }

    static async createAdmission(data) {
        const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;

        // Auto-generate application_no: purely integer increment based on highest existing numeric value
        const [maxRow] = await db.execute(`
            SELECT MAX(CAST(application_no AS UNSIGNED)) AS max_val 
            FROM student_admission_master 
            WHERE application_no REGEXP '^[0-9]+$'
        `);

        let nextAppNo = 14375; // default fallback if no numeric application numbers exist
        if (maxRow[0].max_val !== null) {
            nextAppNo = maxRow[0].max_val + 1;
        }
        const applicationNo = nextAppNo.toString();

        // Auto determine is_10th
        const has10th = data.tenthSchool || data.tenthMark || data.regNo10th;
        const is10th = has10th ? 'Yes' : 'No';

        // Auto determine is_12th
        const has12th = data.twelfthSchool || data.twelfthGroup || data.totalMarks12th;
        const is12th = has12th ? 'Yes' : 'No';

        const sql = `
            INSERT INTO student_admission_master (
                application_no, reg_no_12th, student_name, dob, college, admission_date, department, programme, programme_type, admission_year, quota,
                first_graduate, student_status, remark, aadhaar_no, school_type, fee, reference_remark,
                reference_amount_1, reference_paid_amount, community, father_name, mother_name, father_mobile_no,
                student_mobile_no, mother_mobile_no, father_occupation, father_annual_income, religion, caste_name,
                gender, student_email, address_1, address_2, pincode, country, state, district, city,
                is_10th, school_10th_district, school_10th_city, school_10th_name, mark_10th, reg_no_10th,
                total_marks_10th, percentage_10th, yop_10th, is_12th, school_12th_district, school_12th_city,
                school_12th_name, mark_sheet_given_status, yop_12th, group_in_12th,
                subject_1_name, subject_1_mark, subject_2_name, subject_2_mark, subject_3_name, subject_3_mark,
                subject_4_name, subject_4_mark, subject_5_name, subject_5_mark, subject_6_name, subject_6_mark,
                total_marks_12th, percentage_12th, ug_college, diploma_college, reference_type, reference_college,
                reference_department, reference_programme, reference_programme_type, reference_by_name, reference_by_mobile, consultancy_name,
                consultancy_person_name, consultancy_mobile, course_studied, studied_medium, board_university, nativity
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
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
            toNull(data.programme),
            toNull(data.programmeType),
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
            toNull(data.ugCollege),
            toNull(data.diplomaCollege),
            toNull(data.referenceType),
            toNull(data.referenceCollege),
            toNull(data.referenceDepartment),
            toNull(data.referenceProgramme),
            toNull(data.referenceProgrammeType),
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
                reg_no_12th=?, student_name=?, dob=?, college=?, admission_date=?, department=?, programme=?, programme_type=?, admission_year=?, quota=?,
                first_graduate=?, student_status=?, remark=?, aadhaar_no=?, school_type=?, fee=?, reference_remark=?,
                reference_amount_1=?, reference_paid_amount=?, community=?, father_name=?, mother_name=?, father_mobile_no=?,
                student_mobile_no=?, mother_mobile_no=?, father_occupation=?, father_annual_income=?, religion=?, caste_name=?,
                gender=?, student_email=?, address_1=?, address_2=?, pincode=?, country=?, state=?, district=?, city=?,
                is_10th=?, school_10th_district=?, school_10th_city=?, school_10th_name=?, mark_10th=?, reg_no_10th=?,
                total_marks_10th=?, percentage_10th=?, yop_10th=?, is_12th=?, school_12th_district=?, school_12th_city=?,
                school_12th_name=?, mark_sheet_given_status=?, yop_12th=?, group_in_12th=?,
                subject_1_name=?, subject_1_mark=?, subject_2_name=?, subject_2_mark=?, subject_3_name=?, subject_3_mark=?,
                subject_4_name=?, subject_4_mark=?, subject_5_name=?, subject_5_mark=?, subject_6_name=?, subject_6_mark=?,
                total_marks_12th=?, percentage_12th=?, ug_college=?, diploma_college=?, reference_type=?, reference_college=?,
                reference_department=?, reference_programme=?, reference_programme_type=?, reference_by_name=?, reference_by_mobile=?, consultancy_name=?,
                consultancy_person_name=?, consultancy_mobile=?, course_studied=?, studied_medium=?, board_university=?, nativity=?
            WHERE id=?
        `;

        const values = [
            toNull(data.twelfthRegNo), toNull(data.studentName), toNull(data.dob), toNull(data.college), toNull(data.admissionDate), toNull(data.department), toNull(data.programme), toNull(data.programmeType), toNull(data.year), toNull(data.quota),
            toNull(data.firstGraduate), toNull(data.status), toNull(data.remark), toNull(data.aadharNo), toNull(data.schoolType), toNull(data.fee), toNull(data.rRemark),
            toNull(data.referenceAmount1), toNull(data.rPaidAmount), toNull(data.community), toNull(data.fatherName), toNull(data.motherName), toNull(data.fatherMobile),
            toNull(data.studentMobile), toNull(data.motherMobile), toNull(data.fatherOccupation), toNull(data.fatherAnnualIncome), toNull(data.religion), toNull(data.casteName),
            toNull(data.gender), toNull(data.studentEmail), toNull(data.address1), toNull(data.address2), toNull(data.pincode), toNull(data.country), toNull(data.state), toNull(data.district), toNull(data.city),
            is10th, toNull(data.tenthSchoolDistrict), toNull(data.tenthSchoolCity), toNull(data.tenthSchool), toNull(data.tenthMark), toNull(data.regNo10th),
            toNull(data.totalMarks10th), toNull(data.percentage10th), toNull(data.tenthYOP), is12th, toNull(data.twelfthSchoolDistrict), toNull(data.twelfthSchoolCity),
            toNull(data.twelfthSchool), toNull(data.twelfthMarkSheetStatus), toNull(data.twelfthYOP), toNull(data.twelfthGroup),
            toNull(data.subject1Name), toNull(data.subject1Mark), toNull(data.subject2Name), toNull(data.englishMark), toNull(data.subject3Name), toNull(data.subject2Mark),
            toNull(data.subject4Name), toNull(data.subject3Mark), toNull(data.subject5Name), toNull(data.subject4Mark), toNull(data.subject6Name), toNull(data.subject5Mark),
            toNull(data.totalMarks12th), toNull(data.percentage12th), toNull(data.ugCollege), toNull(data.diplomaCollege), toNull(data.referenceType), toNull(data.referenceCollege),
            toNull(data.referenceDepartment), toNull(data.referenceProgramme), toNull(data.referenceProgrammeType), toNull(data.referenceByName), toNull(data.referenceByMobile), toNull(data.consultancyName),
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
                sam.id as student_id, sam.application_no, sam.student_name, sam.college, sam.programme, sam.department, sam.admission_year, sam.quota,
                cgd.id as cert_id,
                cgd.tenth_marksheet, cgd.tenth_temp, cgd.eleventh_marksheet, cgd.twelfth_marksheet, cgd.twelfth_temp,
                cgd.transfer_certificate, cgd.community_certificate, cgd.first_graduate_certificate,
                cgd.income_certificate, cgd.native_certificate, cgd.bonafide_certificate, cgd.JD_certificate, cgd.remarks
            FROM student_admission_master sam
            LEFT JOIN certificate_given_details cgd ON sam.id = cgd.student_id
            ORDER BY sam.created_at DESC
        `);
        return rows;
    }

    static async saveCertificate(data) {
        const {
            student_id, student_application_no,
            tenth_marksheet, tenth_temp, eleventh_marksheet, twelfth_marksheet, twelfth_temp,
            transfer_certificate, community_certificate, first_graduate_certificate,
            income_certificate, native_certificate, bonafide_certificate, JD_certificate, remarks
        } = data;

        const [existing] = await db.execute('SELECT id FROM certificate_given_details WHERE student_id = ?', [student_id]);

        if (existing.length > 0) {
            const sql = `
                UPDATE certificate_given_details SET
                    tenth_marksheet = ?, tenth_temp = ?, eleventh_marksheet = ?, twelfth_marksheet = ?, twelfth_temp = ?,
                    transfer_certificate = ?, community_certificate = ?, first_graduate_certificate = ?,
                    income_certificate = ?, native_certificate = ?, bonafide_certificate = ?, JD_certificate = ?, remarks = ?
                WHERE student_id = ?
            `;
            await db.execute(sql, [
                tenth_marksheet || null, tenth_temp || null, eleventh_marksheet || null, twelfth_marksheet || null, twelfth_temp || null,
                transfer_certificate || null, community_certificate || null, first_graduate_certificate || null,
                income_certificate || null, native_certificate || null, bonafide_certificate || null, JD_certificate || null, remarks || null,
                student_id
            ]);
            return { action: 'updated', id: existing[0].id };
        } else {
            const sql = `
                INSERT INTO certificate_given_details (
                    student_id, student_application_no,
                    tenth_marksheet, tenth_temp, eleventh_marksheet, twelfth_marksheet, twelfth_temp,
                    transfer_certificate, community_certificate, first_graduate_certificate,
                    income_certificate, native_certificate, bonafide_certificate, JD_certificate, remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.execute(sql, [
                student_id, student_application_no,
                tenth_marksheet || null, tenth_temp || null, eleventh_marksheet || null, twelfth_marksheet || null, twelfth_temp || null,
                transfer_certificate || null, community_certificate || null, first_graduate_certificate || null,
                income_certificate || null, native_certificate || null, bonafide_certificate || null, JD_certificate || null, remarks || null
            ]);
            return { action: 'inserted', id: result.insertId };
        }
    }

    static async deleteCertificate(cert_id) {
        await db.execute('DELETE FROM certificate_given_details WHERE id = ?', [cert_id]);
    }
    static async getFeesStudents(college, department, year) {
        let sql = `SELECT id, application_no, student_name, dob, programme, department, admission_date FROM student_admission_master WHERE 1=1`;
        const params = [];

        if (college) {
            sql += ` AND college = ?`;
            params.push(college);
        }
        if (department) {
            sql += ` AND department = ?`;
            params.push(department);
        }
        if (programme) {
            sql += ` AND programme = ?`;
            params.push(programme);
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
        let studentQuota = null;
        if (data.student_application_no) {
            const [quotaRows] = await db.execute('SELECT quota FROM student_admission_master WHERE application_no = ?', [data.student_application_no]);
            if (quotaRows.length > 0) {
                studentQuota = quotaRows[0].quota;
            }
        }

        if (data.id) {
            const sql = `
                UPDATE student_fees_details SET
                    college = ?, department = ?, programme = ?, year_type = ?, student_application_no = ?, 
                    student_name = ?, student_dob = ?, paid_date = ?, paid_amount = ?, student_quota = ?
                WHERE id = ?
            `;
            const values = [
                data.college || null,
                data.department || null,
                data.programme || '',
                data.year_type || null,
                data.student_application_no || null,
                data.student_name || null,
                data.student_dob || null,
                data.paid_date || null,
                data.paid_amount || null,
                studentQuota,
                data.id
            ];
            await db.execute(sql, values);
            return data.id;
        } else {
            const sql = `
                INSERT INTO student_fees_details (
                    college, department, programme, year_type, student_application_no, student_name, student_dob, paid_date, paid_amount, student_quota
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                data.college || null,
                data.department || null,
                data.programme || '',
                data.year_type || null,
                data.student_application_no || null,
                data.student_name || null,
                data.student_dob || null,
                data.paid_date || null,
                data.paid_amount || null,
                studentQuota
            ];

            const [result] = await db.execute(sql, values);
            return result.insertId;
        }
    }
    static async getAllFees() {
        const [rows] = await db.execute(`
            SELECT *, student_quota AS quota FROM student_fees_details ORDER BY created_at DESC
        `);
        return rows;
    }
    static async deleteFee(id) {
        const [result] = await db.execute('DELETE FROM student_fees_details WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async saveConcession(data) {
        let studentQuota = null;
        if (data.student_application_no) {
            const [quotaRows] = await db.execute('SELECT quota FROM student_admission_master WHERE application_no = ?', [data.student_application_no]);
            if (quotaRows.length > 0) {
                studentQuota = quotaRows[0].quota;
            }
        }

        if (data.id) {
            const sql = `
                UPDATE student_concession_details SET
                    college = ?, department = ?, programme = ?, year = ?, student_application_no = ?, 
                    student_name = ?, student_dob = ?, concession_type = ?, concession_amount = ?, student_quota = ?
                WHERE id = ?
            `;
            const values = [
                data.college || null,
                data.department || null,
                data.programme || '',
                data.year || null,
                data.student_application_no || null,
                data.student_name || null,
                data.student_dob || null,
                data.concession_type || null,
                data.concession_amount || null,
                studentQuota,
                data.id
            ];
            await db.execute(sql, values);
            return data.id;
        } else {
            const sql = `
                INSERT INTO student_concession_details (
                    college, department, programme, year, student_application_no, student_name, student_dob, concession_type, concession_amount, student_quota
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                data.college || null,
                data.department || null,
                data.programme || '',
                data.year || null,
                data.student_application_no || null,
                data.student_name || null,
                data.student_dob || null,
                data.concession_type || null,
                data.concession_amount || null,
                studentQuota
            ];

            const [result] = await db.execute(sql, values);
            return result.insertId;
        }
    }

    static async getAllConcessions() {
        const [rows] = await db.execute(`
            SELECT *, student_quota AS quota FROM student_concession_details ORDER BY created_at DESC
        `);
        return rows;
    }

    static async deleteConcession(id) {
        const [result] = await db.execute('DELETE FROM student_concession_details WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async importAdmissions(records) {
        if (!records || records.length === 0) return { imported: 0 };

        let imported = 0;
        const columns = [
            'application_no', 'reg_no_12th', 'student_name', 'dob', 'college', 'admission_date', 'department', 'programme', 'programme_type', 'admission_year', 'quota',
            'first_graduate', 'student_status', 'remark', 'aadhaar_no', 'school_type', 'fee', 'reference_remark',
            'reference_amount_1', 'reference_paid_amount', 'community', 'father_name', 'mother_name', 'father_mobile_no',
            'student_mobile_no', 'mother_mobile_no', 'father_occupation', 'father_annual_income', 'religion', 'caste_name',
            'gender', 'student_email', 'address_1', 'address_2', 'pincode', 'country', 'state', 'district', 'city',
            'is_10th', 'school_10th_district', 'school_10th_city', 'school_10th_name', 'mark_10th', 'reg_no_10th',
            'total_marks_10th', 'percentage_10th', 'yop_10th', 'is_12th', 'school_12th_district', 'school_12th_city',
            'school_12th_name', 'mark_sheet_given_status', 'yop_12th', 'group_in_12th',
            'subject_1_name', 'subject_1_mark', 'subject_2_name', 'subject_2_mark', 'subject_3_name', 'subject_3_mark',
            'subject_4_name', 'subject_4_mark', 'subject_5_name', 'subject_5_mark', 'subject_6_name', 'subject_6_mark',
            'total_marks_12th', 'percentage_12th', 'ug_college', 'diploma_college', 'reference_type', 'reference_college',
            'reference_department', 'reference_by_name', 'reference_by_mobile', 'consultancy_name',
            'consultancy_person_name', 'consultancy_mobile', 'course_studied', 'studied_medium', 'board_university', 'nativity'
        ];

        for (const record of records) {
            // Determine application_no
            let applicationNo = record.application_no;
            if (!applicationNo) {
                const [maxRow] = await db.execute(`
                    SELECT MAX(CAST(application_no AS UNSIGNED)) AS max_val 
                    FROM student_admission_master 
                    WHERE application_no REGEXP '^[0-9]+$'
                `);
                let nextAppNo = 14375;
                if (maxRow[0].max_val !== null) {
                    nextAppNo = maxRow[0].max_val + 1;
                }
                applicationNo = nextAppNo.toString();
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
