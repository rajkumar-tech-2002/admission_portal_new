const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Admission', 'AdmissionProcess.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Import
if (!content.includes('import AdmissionList')) {
    content = content.replace(
        "import styles from '../../components/css/AdmissionProcess.module.css';",
        "import styles from '../../components/css/AdmissionProcess.module.css';\nimport AdmissionList from './AdmissionList';"
    );
}

// 2. Add handleEdit
if (!content.includes('const handleEdit = (record) =>')) {
    const handleEditStr = `
    const handleEdit = (record) => {
        setFormData({
            twelfthRegNo: record.reg_no_12th || '',
            studentName: record.student_name || '',
            dob: record.dob ? record.dob.substring(0, 10) : '',
            college: record.college || '',
            admissionDate: record.admission_date ? record.admission_date.substring(0, 10) : '',
            department: record.department || '',
            year: record.admission_year || '',
            quota: record.quota || '',
            firstGraduate: record.first_graduate || '',
            status: record.student_status || '',
            remark: record.remark || '',
            aadharNo: record.aadhaar_no || '',
            schoolType: record.school_type || '',
            fee: record.fee || '',
            rRemark: record.reference_remark || '',
            referenceAmount1: record.reference_amount_1 || '',
            rPaidAmount: record.reference_paid_amount || '',

            community: record.community || '',
            fatherName: record.father_name || '',
            motherName: record.mother_name || '',
            fatherMobile: record.father_mobile_no || '',
            studentMobile: record.student_mobile_no || '',
            motherMobile: record.mother_mobile_no || '',
            fatherOccupation: record.father_occupation || '',
            fatherAnnualIncome: record.father_annual_income || '',
            religion: record.religion || '',
            casteName: record.caste_name || '',
            gender: record.gender || '',

            studentEmail: record.student_email || '',
            address1: record.address_1 || '',
            address2: record.address_2 || '',
            pincode: record.pincode || '',
            country: record.country || 'India',
            state: record.state || '',
            district: record.district || '',
            city: record.city || '',

            tenthSchoolDistrict: record.school_10th_district || '',
            tenthSchoolCity: record.school_10th_city || '',
            tenthSchool: record.school_10th_name || '',
            tenthMark: record.mark_10th || '',
            regNo10th: record.reg_no_10th || '',
            totalMarks10th: record.total_marks_10th || '500',
            percentage10th: record.percentage_10th || '',
            tenthYOP: record.yop_10th || '',

            twelfthSchoolDistrict: record.school_12th_district || '',
            twelfthSchoolCity: record.school_12th_city || '',
            twelfthSchool: record.school_12th_name || '',
            twelfthMarkSheetStatus: record.mark_sheet_given_status || 'No',
            twelfthYOP: record.yop_12th || '',
            twelfthGroup: record.group_in_12th || '',
            languageStudied: 'Tamil',
            subject1Name: record.subject_1_name || 'Tamil / Sanskrit Option',
            subject1Mark: record.subject_1_mark || '',
            subject2Name: record.subject_2_name || 'English',
            englishMark: record.subject_2_mark || '',
            subject3Name: record.subject_3_name || 'Physics/Theory I',
            subject2Mark: record.subject_3_mark || '',
            subject4Name: record.subject_4_name || 'Chemistry / Practical I',
            subject3Mark: record.subject_4_mark || '',
            subject5Name: record.subject_5_name || 'Biology / CS / Practical II',
            subject4Mark: record.subject_5_mark || '',
            subject6Name: record.subject_6_name || 'Maths',
            subject5Mark: record.subject_6_mark || '',
            totalMarks12th: record.total_marks_12th || '',
            percentage12th: record.percentage_12th || '',

            ugUniversity: record.ug_university || '',

            referenceType: record.reference_type || '',
            referenceCollege: record.reference_college || '',
            referenceDepartment: record.reference_department || '',
            referenceByName: record.reference_by_name || '',
            referenceByMobile: record.reference_by_mobile || '',
            consultancyName: record.consultancy_name || '',
            consultancyPersonName: record.consultancy_person_name || '',
            consultancyMobile: record.consultancy_mobile || '',

            courseStudied: record.course_studied || '',
            medium: record.studied_medium || 'English',
            boardUniversity: record.board_university || '',
            nativity: record.nativity || 'Tamil Nadu'
        });
        setEditingId(record.id);
        setIsEntryFormVisible(true);
    };
`;
    content = content.replace(
        "    // Helper: Submit full form to backend DB",
        `${handleEditStr}\n    // Helper: Submit full form to backend DB`
    );
}

// 3. Update handleSubmitForm to handle update
if (!content.includes('res = await apiService.put(`/admissions/${editingId}`')) {
    const submitPattern = /const res = await apiService\.post\('\/admissions\/submit', formData\);/g;
    content = content.replace(
        submitPattern,
        `const res = editingId 
                ? await apiService.put(\`/admissions/\${editingId}\`, formData)
                : await apiService.post('/admissions/submit', formData);`
    );
    
    // Also reset editingId and form visibility on success
    const successPattern = /toast\.success\('Congratulations! Admission record created successfully in student_admission_master!'\);/g;
    content = content.replace(
        successPattern,
        `toast.success(editingId ? 'Admission record updated successfully!' : 'Congratulations! Admission record created successfully in student_admission_master!');
                setEditingId(null);
                setIsEntryFormVisible(false);`
    );
}

// 4. Wrap form in isEntryFormVisible logic and add AdmissionList
const formStartMarker = "{activeSection === 'entry' && (";
if (content.includes(formStartMarker) && !content.includes('<AdmissionList')) {
    const listComponentStr = `{activeSection === 'entry' && !isEntryFormVisible && (
                    <AdmissionList 
                        admissions={rawAdmissions}
                        onAdd={() => {
                            handleResetForm();
                            setEditingId(null);
                            setIsEntryFormVisible(true);
                        }}
                        onEdit={handleEdit}
                        onRefresh={fetchAdmissionsList}
                    />
                )}
                {activeSection === 'entry' && isEntryFormVisible && (`;
    
    content = content.replace(
        "{activeSection === 'entry' && (",
        listComponentStr
    );
}

// 5. Add back button to form header
if (content.includes('<h1 className={styles.pageTitle}>New Admission Entry</h1>') && !content.includes('Back to List')) {
    content = content.replace(
        '<div className={styles.pageHeader}>',
        `<div className={styles.pageHeader}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>`
    );
    content = content.replace(
        '<p className={styles.pageDescription}>Enter high-fidelity registration and application details below to admit the student.</p>',
        `<p className={styles.pageDescription}>{editingId ? 'Edit admission entry details below.' : 'Enter high-fidelity registration and application details below to admit the student.'}</p>
                                </div>
                                <button type="button" onClick={() => setIsEntryFormVisible(false)} className={reportStyles.actionBtn} style={{ background: '#6b7280', alignSelf: 'flex-start' }}>
                                    Back to List
                                </button>
                            </div>`
    );
    
    content = content.replace(
        '<h1 className={styles.pageTitle}>New Admission Entry</h1>',
        '<h1 className={styles.pageTitle}>{editingId ? "Edit Admission Entry" : "New Admission Entry"}</h1>'
    );
}

// 6. Fix handleResetForm to clear editingId
if (content.includes('const handleResetForm = () => {') && !content.includes('setEditingId(null)')) {
    content = content.replace(
        'setFormData({',
        'setEditingId(null);\n        setFormData({'
    );
}


fs.writeFileSync(filePath, content);
console.log('AdmissionProcess.jsx patched successfully');
