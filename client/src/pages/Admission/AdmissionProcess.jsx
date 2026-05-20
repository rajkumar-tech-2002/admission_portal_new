import React, { useState, useEffect } from 'react';
import { 
    UserPlus, Users, Award, Search, FileText, CheckCircle, 
    ArrowRight, ArrowLeft, Trash2, UploadCloud, Check, RotateCcw, 
    FileUp, Calendar, AlertCircle
} from 'lucide-react';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';
import styles from '../../components/css/AdmissionProcess.module.css';

const AdmissionProcess = ({ defaultSection = 'entry' }) => {
    // Left sub-sidebar tab selection: 'entry', 'staff', 'certificates'
    const [activeSection, setActiveSection] = useState(defaultSection);

    // Keep activeSection in sync with the route prop
    useEffect(() => {
        setActiveSection(defaultSection);
    }, [defaultSection]);

    // Horizontal Form Tabs (for Admission Entry)
    const [activeFormTab, setActiveFormTab] = useState(1);

    // Master database data populated dynamically from backend
    const [masterData, setMasterData] = useState({
        departments: [],
        studies: [],
        communities: [],
        admissionTypes: [],
        referenceTypes: [],
        admissionStatuses: [],
        districts: [],
        schools: [],
        consultancies: [],
        staff: [],
        annualIncomes: [],
        religions: [],
        schoolTypes: [],
        admissionYears: [],
        groups12th: []
    });

    // Autocomplete & Cascading Dropdown States
    const [admittedStudents, setAdmittedStudents] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // School Autocomplete States
    const [tenthSchoolSuggestions, setTenthSchoolSuggestions] = useState([]);
    const [showTenthSuggestions, setShowTenthSuggestions] = useState(false);
    const [twelfthSchoolSuggestions, setTwelfthSchoolSuggestions] = useState([]);
    const [showTwelfthSuggestions, setShowTwelfthSuggestions] = useState(false);

    // Cascading Staff details
    const [staffInstitutions, setStaffInstitutions] = useState([]);
    const [staffDepartments, setStaffDepartments] = useState([]);
    const [staffMembers, setStaffMembers] = useState([]);

    // Consultancy details
    const [consultancyList, setConsultancyList] = useState([]);

    // Form States
    const [formData, setFormData] = useState({
        // Tab 1: Admission Details (New Tab)
        twelfthRegNo: '',
        studentName: '',
        dob: '',
        college: '',
        admissionDate: '',
        department: '',
        year: '',
        quota: '',
        firstGraduate: '',
        status: '',
        remark: '',
        aadharNo: '',
        schoolType: '',
        fee: '',
        rRemark: '',
        referenceAmount1: '',
        rPaidAmount: '',

        // Tab 2: Personal
        community: '',
        fatherName: '',
        motherName: '',
        fatherMobile: '',
        studentMobile: '',
        motherMobile: '',
        fatherOccupation: '',
        fatherAnnualIncome: '',
        religion: '',
        casteName: '',
        gender: '',

        // Tab 3: Communication
        studentEmail: '',
        address1: '',
        address2: '',
        pincode: '',
        country: 'India',
        state: 'Tamil Nadu',
        district: '',
        city: '',

        // Tab 4: 10th Details
        tenthSchoolDistrict: '',
        tenthSchoolCity: '',
        tenthSchool: '',
        tenthMark: '',
        regNo10th: '',
        totalMarks10th: '500',
        percentage10th: '',
        tenthYOP: '',

        // Tab 5: 12th Details
        twelfthSchoolDistrict: '',
        twelfthSchoolCity: '',
        twelfthSchool: '',
        twelfthMarkSheetStatus: 'No',
        twelfthYOP: '',
        twelfthGroup: '',
        languageStudied: 'Tamil',
        subject1Name: 'Tamil / Sanskrit Option',
        subject1Mark: '',
        subject2Name: 'English',
        englishMark: '',
        subject3Name: 'Physics/Theory I',
        subject2Mark: '',
        subject4Name: 'Chemistry / Practical I',
        subject3Mark: '',
        subject5Name: 'Biology / CS / Practical II',
        subject4Mark: '',
        subject6Name: 'Maths',
        subject5Mark: '',
        subject6Mark: '',
        totalMarks12th: '',
        percentage12th: '',

        // Tab 6: UG Details
        ugUniversity: '',

        // Tab 7: Reference Details
        referenceType: '',
        referenceCollege: '',
        referenceDepartment: '',
        referenceByName: '',
        referenceByMobile: '',
        consultancyName: '',
        consultancyPersonName: '',
        consultancyMobile: '',

        // Tab 8: Last Studied
        courseStudied: '',
        medium: 'English',
        boardUniversity: '',
        nativity: 'Tamil Nadu'
    });

    // Simulated Student List for "Staff View"
    const [students, setStudents] = useState([
        { id: 'ADM2026001', name: 'Arun Kumar K', regno: '26AD001', aadhar: '4321 8765 0912', email: 'arun.k@gmail.com', mobile: '9876543210', dept: 'Information Technology', type: 'Counseling', status: 'Admitted' },
        { id: 'ADM2026002', name: 'Deepa Lakshmi R', regno: '26AD002', aadhar: '9012 3456 7890', email: 'deepa.r@gmail.com', mobile: '8765432109', dept: 'Computer Science', type: 'Management', status: 'Admitted' },
        { id: 'ADM2026003', name: 'Naveen Prasath S', regno: '26AD003', aadhar: '5678 1234 9012', email: 'naveen.s@gmail.com', mobile: '7654321098', dept: 'Artificial Intelligence', type: 'Direct', status: 'Pending' },
        { id: 'ADM2026004', name: 'Shreya Vardhini J', regno: '26AD004', aadhar: '1234 5678 9012', email: 'shreya.j@gmail.com', mobile: '6543210987', dept: 'Electrical Engineering', type: 'Counseling', status: 'Admitted' },
        { id: 'ADM2026005', name: 'Vijay Anand M', regno: '26AD005', aadhar: '7890 1234 5678', email: 'vijay.m@gmail.com', mobile: '9012345678', dept: 'Mechanical Engineering', type: 'Management', status: 'Discontinued' }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('');

    // Certificate Upload States
    const [uploadedFiles, setUploadedFiles] = useState({
        tenthMarksheet: null,
        twelfthMarksheet: null,
        transferCertificate: null,
        communityCertificate: null,
        aadharCard: null,
        ugDegree: null
    });

    // Fetch Master Data & Admissions Autocomplete Lists on Mount
    useEffect(() => {
        const fetchMaster = async () => {
            try {
                const response = await apiService.get('/master');
                if (response.data.success) {
                    const data = response.data.data;
                    setMasterData({
                        departments: data.departments || [],
                        studies: data.studies || [],
                        communities: data.communities || [],
                        admissionTypes: data.admissionTypes || data.admission_types || [],
                        referenceTypes: data.referenceTypes || data.reference_types || [],
                        admissionStatuses: data.admissionStatuses || data.admission_statuses || [],
                        districts: data.districts || [],
                        schools: data.schools || [],
                        consultancies: data.consultancies || [],
                        staff: data.staff || [],
                        annualIncomes: data.annualIncomes || data.annual_incomes || data.annualIncome || [],
                        religions: data.religions || [],
                        schoolTypes: data.schoolTypes || [],
                        admissionYears: data.admissionYears || [],
                        groups12th: data.groups12th || []
                    });
                }
            } catch (err) {
                console.error("Failed to load ERP master dropdowns:", err);
            }
        };

        const fetchAutocompleteLists = async () => {
            try {
                // 1. Fetch Admitted Students for Twelfth Reg No suggestion
                const studRes = await apiService.get('/admissions/admitted-students');
                if (studRes.data.success) {
                    setAdmittedStudents(studRes.data.data);
                }

                // 2. Fetch distinct staff institutions for referenceCollege dropdown
                const instRes = await apiService.get('/admissions/staff-institutions');
                if (instRes.data.success) {
                    setStaffInstitutions(instRes.data.data);
                }

                // 3. Fetch consultancies list for consultancy auto-fetch
                const consRes = await apiService.get('/admissions/consultancies');
                if (consRes.data.success) {
                    setConsultancyList(consRes.data.data);
                }
            } catch (err) {
                console.error("Failed to load autocomplete/cascade database lists:", err);
            }
        };

        fetchMaster();
        fetchAutocompleteLists();
    }, []);

    // Dismiss suggestions on global outer clicks
    useEffect(() => {
        const handleDocumentClick = () => {
            setShowSuggestions(false);
            setShowTenthSuggestions(false);
            setShowTwelfthSuggestions(false);
        };
        document.addEventListener('click', handleDocumentClick);
        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, []);

    // Load admissions in Staff View from database
    const fetchAdmissionsList = async () => {
        try {
            const res = await apiService.get('/admissions/list');
            if (res.data.success) {
                const dbStudents = res.data.data.map(adm => ({
                    id: `ADM${String(adm.id).padStart(7, '0')}`,
                    name: adm.student_name || 'N/A',
                    regno: adm.reg_no_12th || 'N/A',
                    aadhar: adm.aadhaar_no || 'N/A',
                    email: adm.student_email || 'N/A',
                    mobile: adm.student_mobile_no || 'N/A',
                    dept: adm.department || 'N/A',
                    type: adm.quota || 'N/A',
                    status: adm.student_status || 'N/A'
                }));
                setStudents(dbStudents);
            }
        } catch (err) {
            console.error("Failed to fetch student admissions from DB:", err);
        }
    };

    useEffect(() => {
        if (activeSection === 'staff') {
            fetchAdmissionsList();
        }
    }, [activeSection]);

    // Helper: Handle input changes
    const handleChange = async (e) => {
        const { name, value } = e.target;

        // 1. Handlers for twelfthRegNo Autocomplete Suggestions
        if (name === 'twelfthRegNo') {
            setFormData(prev => ({ ...prev, twelfthRegNo: value }));
            if (value.trim().length > 0) {
                const filtered = admittedStudents.filter(student => 
                    (student.reg_no_12th || '').toLowerCase().includes(value.toLowerCase())
                );
                setFilteredSuggestions(filtered);
                setShowSuggestions(true);
            } else {
                setFilteredSuggestions([]);
                setShowSuggestions(false);
            }
            return;
        }

        // 1b. Handlers for tenthSchool Autocomplete
        if (name === 'tenthSchool') {
            setFormData(prev => ({ ...prev, tenthSchool: value }));
            const district = formData.tenthSchoolDistrict || '';
            const city = formData.tenthSchoolCity || '';

            let filtered = masterData.schools || [];
            if (district) {
                filtered = filtered.filter(s => (s.district_name || '').toLowerCase() === district.toLowerCase());
            }
            if (city) {
                filtered = filtered.filter(s => (s.city || '').toLowerCase().includes(city.toLowerCase()));
            }
            if (value.trim().length > 0) {
                filtered = filtered.filter(s => (s.school_name || '').toLowerCase().includes(value.toLowerCase()));
            }
            setTenthSchoolSuggestions(filtered);
            setShowTenthSuggestions(true);
            return;
        }

        // 1c. Handlers for twelfthSchool Autocomplete
        if (name === 'twelfthSchool') {
            setFormData(prev => ({ ...prev, twelfthSchool: value }));
            const district = formData.twelfthSchoolDistrict || '';
            const city = formData.twelfthSchoolCity || '';

            let filtered = masterData.schools || [];
            if (district) {
                filtered = filtered.filter(s => (s.district_name || '').toLowerCase() === district.toLowerCase());
            }
            if (city) {
                filtered = filtered.filter(s => (s.city || '').toLowerCase().includes(city.toLowerCase()));
            }
            if (value.trim().length > 0) {
                filtered = filtered.filter(s => (s.school_name || '').toLowerCase().includes(value.toLowerCase()));
            }
            setTwelfthSchoolSuggestions(filtered);
            setShowTwelfthSuggestions(true);
            return;
        }

        // 2. Cascading handler for Reference College (Institution)
        if (name === 'referenceCollege' && formData.referenceType === 'Staff') {
            setFormData(prev => ({ 
                ...prev, 
                referenceCollege: value,
                referenceDepartment: '',
                referenceByName: '',
                referenceByMobile: '' 
            }));
            setStaffDepartments([]);
            setStaffMembers([]);
            if (value) {
                try {
                    const res = await apiService.get(`/admissions/staff-departments?institution=${encodeURIComponent(value)}`);
                    if (res.data.success) {
                        setStaffDepartments(res.data.data);
                    }
                } catch (err) {
                    console.error("Failed to fetch cascading departments:", err);
                }
            }
            return;
        }

        // 3. Cascading handler for Reference Department
        if (name === 'referenceDepartment' && formData.referenceType === 'Staff') {
            setFormData(prev => ({ 
                ...prev, 
                referenceDepartment: value,
                referenceByName: '',
                referenceByMobile: '' 
            }));
            setStaffMembers([]);
            if (value) {
                try {
                    const res = await apiService.get(`/admissions/staff-members?institution=${encodeURIComponent(formData.referenceCollege)}&department=${encodeURIComponent(value)}`);
                    if (res.data.success) {
                        setStaffMembers(res.data.data);
                    }
                } catch (err) {
                    console.error("Failed to fetch cascading staff members:", err);
                }
            }
            return;
        }

        // 4. Cascading handler for Reference By Name (Staff Name)
        if (name === 'referenceByName' && formData.referenceType === 'Staff') {
            const selectedStaff = staffMembers.find(s => s.staff_name === value);
            setFormData(prev => ({ 
                ...prev, 
                referenceByName: value,
                referenceByMobile: selectedStaff ? (selectedStaff.staff_phone || '') : ''
            }));
            return;
        }

        // 5. Consultancy Name Auto-fill
        if (name === 'consultancyName') {
            const selectedCons = consultancyList.find(c => c.consultancy_name === value);
            setFormData(prev => ({
                ...prev,
                consultancyName: value,
                consultancyPersonName: selectedCons ? (selectedCons.consultancy_person_name || '') : '',
                consultancyMobile: selectedCons ? (selectedCons.consultancy_mobile || '') : ''
            }));
            return;
        }

        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Dynamic calculation for 10th percentage
            if (name === 'tenthMark') {
                const marks = parseFloat(value) || 0;
                const total = parseFloat(prev.totalMarks10th) || 500;
                updated.percentage10th = ((marks / total) * 100).toFixed(2) + '%';
            }

            // Dynamic calculation for 12th Marks Total and Percentage
            if ([
                'subject1Mark', 'englishMark', 'subject2Mark', 
                'subject3Mark', 'subject4Mark', 'subject5Mark', 'subject6Mark'
            ].includes(name)) {
                const sub1 = parseFloat(name === 'subject1Mark' ? value : prev.subject1Mark) || 0;
                const eng = parseFloat(name === 'englishMark' ? value : prev.englishMark) || 0;
                const sub2 = parseFloat(name === 'subject2Mark' ? value : prev.subject2Mark) || 0;
                const sub3 = parseFloat(name === 'subject3Mark' ? value : prev.subject3Mark) || 0;
                const sub4 = parseFloat(name === 'subject4Mark' ? value : prev.subject4Mark) || 0;
                const sub5 = parseFloat(name === 'subject5Mark' ? value : prev.subject5Mark) || 0;
                const sub6 = parseFloat(name === 'subject6Mark' ? value : prev.subject6Mark) || 0;

                const total = sub1 + eng + sub2 + sub3 + sub4 + sub5 + sub6;
                updated.totalMarks12th = total.toString();
                updated.percentage12th = ((total / 600) * 100).toFixed(2) + '%';
            }

            return updated;
        });
    };

    // Helper: Reset form state
    const handleResetForm = () => {
        setFormData({
            twelfthRegNo: '', studentName: '', dob: '', college: '', admissionDate: '', department: '', year: '', quota: '',
            firstGraduate: '', status: '', remark: '', aadharNo: '', schoolType: '', fee: '', rRemark: '', referenceAmount1: '', rPaidAmount: '',
            community: '', fatherName: '', motherName: '', fatherMobile: '', studentMobile: '',
            motherMobile: '', fatherOccupation: '', fatherAnnualIncome: '', religion: '', casteName: '', gender: '',
            studentEmail: '', address1: '', address2: '', pincode: '', country: 'India', state: 'Tamil Nadu', district: '', city: '',
            tenthSchoolDistrict: '', tenthSchoolCity: '', tenthSchool: '', tenthMark: '', regNo10th: '', totalMarks10th: '500', percentage10th: '', tenthYOP: '',
            twelfthSchoolDistrict: '', twelfthSchoolCity: '', twelfthSchool: '', twelfthMarkSheetStatus: 'No', twelfthYOP: '', twelfthGroup: '', languageStudied: 'Tamil',
            subject1Name: 'Tamil / Sanskrit Option', subject1Mark: '',
            subject2Name: 'English', englishMark: '',
            subject3Name: 'Physics/Theory I', subject2Mark: '',
            subject4Name: 'Chemistry / Practical I', subject3Mark: '',
            subject5Name: 'Biology / CS / Practical II', subject4Mark: '',
            subject6Name: 'Maths', subject5Mark: '', subject6Mark: '',
            totalMarks12th: '', percentage12th: '',
            ugUniversity: '',
            referenceType: '', referenceCollege: '', referenceDepartment: '', referenceByName: '', referenceByMobile: '', consultancyName: '', consultancyPersonName: '', consultancyMobile: '',
            courseStudied: '', medium: 'English', boardUniversity: '', nativity: 'Tamil Nadu'
        });
        setActiveFormTab(1);
        toast.success('Admission Form Reset Successfully!');
    };

    // Helper: Submit full form to backend DB
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        toast.loading('Saving and Processing Admission Entry...', { id: 'submit-load' });

        try {
            const res = await apiService.post('/admissions/submit', formData);
            toast.dismiss('submit-load');

            if (res.data.success) {
                toast.success('Congratulations! Admission record created successfully in student_admission_master!');
                handleResetForm();
                fetchAdmissionsList(); // Load real admissions
                setActiveSection('staff'); // Navigate to Staff View
            }
        } catch (err) {
            toast.dismiss('submit-load');
            const data = err.response?.data;
            if (data && data.missingFields) {
                toast.error(
                    <div>
                        <strong style={{ display: 'block', marginBottom: '8px', color: '#b91c1c' }}>
                            Submission Failed! Missing Mandatory Fields:
                        </strong>
                        <ul style={{ margin: '0 0 0 15px', padding: 0, fontSize: '0.875rem', lineHeight: '1.4' }}>
                            {data.missingFields.map((f, idx) => (
                                <li key={idx}>{f}</li>
                            ))}
                        </ul>
                    </div>,
                    { duration: 8000 }
                );
            } else {
                toast.error(err.response?.data?.message || 'Failed to submit admission record. Please try again.');
            }
        }
    };

    // Helper: Handle file changes in Certificate Upload
    const handleFileChange = (e, key) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFiles(prev => ({
                ...prev,
                [key]: {
                    name: file.name,
                    size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
                }
            }));
            toast.success(`Successfully uploaded ${file.name}!`);
        }
    };

    // Helper: Remove file preview
    const handleRemoveFile = (key) => {
        setUploadedFiles(prev => ({
            ...prev,
            [key]: null
        }));
        toast.error('File removed.');
    };

    // Filters for simulated student table
    const filteredStudents = students.filter(s => {
        const matchesSearch = 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.regno.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.mobile.includes(searchTerm);
        const matchesDept = deptFilter === '' || s.dept.toLowerCase().includes(deptFilter.toLowerCase());
        return matchesSearch && matchesDept;
    });

    return (
        <div className={styles.container}>
            {/* MAIN CONTENT AREA */}
            <main className={styles.contentArea} style={{ padding: '0' }}>
                
                {/* 1. ADMISSION ENTRY PORTAL */}
                {activeSection === 'entry' && (
                    <form onSubmit={handleSubmitForm}>
                        <div className={styles.pageHeader}>
                            <h1 className={styles.pageTitle}>New Admission Entry</h1>
                            <p className={styles.pageDescription}>Enter high-fidelity registration and application details below to admit the student.</p>
                        </div>

                        {/* STICKY HORIZONTAL TABS */}
                        <div className={styles.tabsContainer}>
                            {[
                                { id: 1, name: 'Admission' },
                                { id: 2, name: 'Personal' },
                                { id: 3, name: 'Communication' },
                                { id: 4, name: '10th Details' },
                                { id: 5, name: '12th Details' },
                                { id: 6, name: 'UG_Details' },
                                { id: 7, name: 'Reference_Details' },
                                { id: 8, name: 'Last Studied' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`${styles.tabButton} ${activeFormTab === tab.id ? styles.activeTabButton : ''}`}
                                    onClick={() => setActiveFormTab(tab.id)}
                                >
                                    <span className={styles.tabBadge}>{tab.id}</span>
                                    {tab.name}
                                </button>
                            ))}
                        </div>

                        {/* TAB 1: ADMISSION DETAILS */}
                        {activeFormTab === 1 && (
                            <div className={styles.formCard}>
                                <div className={styles.cardSectionTitle}>Admission Details</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup} style={{ position: 'relative' }}>
                                        <label className={styles.inputLabel}>12th Regno <span className={styles.requiredAsterisk}>*</span></label>
                                        <input type="text" name="twelfthRegNo" value={formData.twelfthRegNo} onChange={handleChange} required className={styles.inputField} placeholder="12th Registration Number" autoComplete="off" />
                                        {showSuggestions && filteredSuggestions.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '0.375rem',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                zIndex: 999,
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                marginTop: '0.25rem'
                                            }}>
                                                {filteredSuggestions.map((student, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={async () => {
                                                            let collegeName = '';
                                                            const course = student.selected_course || '';
                                                            if (course.startsWith('NEC')) {
                                                                collegeName = 'Nandha Engineering College';
                                                            } else if (course.startsWith('NCT')) {
                                                                collegeName = 'Nandha College of Technology';
                                                            } else if (course.startsWith('NPC')) {
                                                                collegeName = 'Nandha Polytechnic College';
                                                            }

                                                            setFormData(prev => ({
                                                                ...prev,
                                                                twelfthRegNo: student.reg_no_12th,
                                                                studentName: student.std_name,
                                                                dob: student.std_dob ? student.std_dob.substring(0, 10) : '',
                                                                aadharNo: student.aadhaar_no || '',
                                                                studentMobile: student.std_mobile_no || '',
                                                                community: student.community || '',
                                                                quota: student.admission_quota || '',
                                                                referenceType: student.reference_type || '',
                                                                referenceByName: student.reference_name || '',
                                                                referenceDepartment: student.reference_dept || '',
                                                                referenceCollege: student.reference_institution || '',
                                                                referenceByMobile: student.reference_contact_no || '',
                                                                city: student.city || '',
                                                                department: student.selected_dept || '',
                                                                college: collegeName
                                                            }));

                                                            // Handle cascading fetch for Staff reference details
                                                            if (student.reference_type === 'Staff') {
                                                                if (student.reference_institution) {
                                                                    try {
                                                                        const depRes = await apiService.get(`/admissions/staff-departments?institution=${encodeURIComponent(student.reference_institution)}`);
                                                                        if (depRes.data.success) {
                                                                            setStaffDepartments(depRes.data.data);
                                                                        }
                                                                        
                                                                        if (student.reference_dept) {
                                                                            const memRes = await apiService.get(`/admissions/staff-members?institution=${encodeURIComponent(student.reference_institution)}&department=${encodeURIComponent(student.reference_dept)}`);
                                                                            if (memRes.data.success) {
                                                                                setStaffMembers(memRes.data.data);
                                                                            }
                                                                        }
                                                                    } catch (err) {
                                                                        console.error("Failed to load cascading staff details on auto-fill:", err);
                                                                    }
                                                                }
                                                            }

                                                            setShowSuggestions(false);
                                                            toast.success(`Auto-fetched details from record_master for ${student.std_name}!`);
                                                        }}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            cursor: 'pointer',
                                                            borderBottom: idx === filteredSuggestions.length - 1 ? 'none' : '1px solid #f1f5f9',
                                                            color: '#1e293b',
                                                            fontSize: '0.875rem',
                                                            textAlign: 'left'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div style={{ fontWeight: '600', color: '#1d4ed8' }}>{student.reg_no_12th}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>{student.std_name} ({student.selected_dept})</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Student Name <span className={styles.requiredAsterisk}>*</span></label>
                                        <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} required className={styles.inputField} placeholder="Student Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>DOB <span className={styles.requiredAsterisk}>*</span></label>
                                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className={styles.inputField} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>college <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="college" value={formData.college} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select College</option>
                                            <option value="Nandha Engineering College">Nandha Engineering College</option>
                                            <option value="Nandha College of Technology">Nandha College of Technology</option>
                                            <option value="Nandha Polytechnic College">Nandha Polytechnic College</option>
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Admission Date <span className={styles.requiredAsterisk}>*</span></label>
                                        <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} required className={styles.inputField} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>department <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="department" value={formData.department} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Department</option>
                                            {masterData.departments.map(d => <option key={d.id} value={d.department}>{d.department}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Year <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="year" value={formData.year} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Year</option>
                                            {masterData.admissionYears.map(y => (
                                                <option key={y.id} value={y.admission_year_name}>{y.admission_year_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Quota <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="quota" value={formData.quota} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Quota</option>
                                            {masterData.admissionTypes.map(q => <option key={q.id} value={q.admission_type}>{q.admission_type}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>First Graduate <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="firstGraduate" value={formData.firstGraduate} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select First Graduate Status</option>
                                            <option value="COUNSELLING - SG">COUNSELLING - SG</option>
                                            <option value="COUNSELLING - FG">COUNSELLING - FG</option>
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Status <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="status" value={formData.status} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Status</option>
                                            {masterData.admissionStatuses.map(s => <option key={s.id} value={s.admission_status}>{s.admission_status}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Remark</label>
                                        <input type="text" name="remark" value={formData.remark} onChange={handleChange} className={styles.inputField} placeholder="Remark" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Adhaar Number</label>
                                        <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleChange} maxLength={12} className={styles.inputField} placeholder="12-digit Aadhaar Number" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>School Type</label>
                                        <select name="schoolType" value={formData.schoolType} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select School Type</option>
                                            {masterData.schoolTypes.map(st => <option key={st.id} value={st.school_type_name}>{st.school_type_name}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Fee</label>
                                        <input type="number" name="fee" value={formData.fee} onChange={handleChange} className={styles.inputField} placeholder="Fee Amount" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>R Remark</label>
                                        <input type="text" name="rRemark" value={formData.rRemark} onChange={handleChange} className={styles.inputField} placeholder="Reference Remark" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Reference Amount 1</label>
                                        <input type="number" name="referenceAmount1" value={formData.referenceAmount1} onChange={handleChange} className={styles.inputField} placeholder="Reference Amount 1" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>R Paid Amount</label>
                                        <input type="number" name="rPaidAmount" value={formData.rPaidAmount} onChange={handleChange} className={styles.inputField} placeholder="Reference Paid Amount" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: PERSONAL DETAILS */}
                        {activeFormTab === 2 && (
                            <div className={styles.formCard}>
                                <div className={styles.cardSectionTitle}>Personal Information</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Community <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="community" value={formData.community} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Community</option>
                                            {masterData.communities.map(c => (
                                                <option key={c.id} value={c.community || c.community_name}>{c.community || c.community_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>father Name</label>
                                        <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className={styles.inputField} placeholder="Father Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>mother Name</label>
                                        <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} className={styles.inputField} placeholder="Mother Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>father Mobile Number <span className={styles.requiredAsterisk}>*</span></label>
                                        <input type="tel" name="fatherMobile" value={formData.fatherMobile} onChange={handleChange} required className={styles.inputField} placeholder="Father Mobile" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Student Mobile</label>
                                        <input type="tel" name="studentMobile" value={formData.studentMobile} onChange={handleChange} className={styles.inputField} placeholder="Student Mobile" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Mother Mobile</label>
                                        <input type="tel" name="motherMobile" value={formData.motherMobile} onChange={handleChange} className={styles.inputField} placeholder="Mother Mobile" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Father Occupation</label>
                                        <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className={styles.inputField} placeholder="Occupation" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Father Annual Income</label>
                                        <select name="fatherAnnualIncome" value={formData.fatherAnnualIncome} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Annual Income</option>
                                            {masterData.annualIncomes.map(a => (
                                                <option key={a.id} value={a.income_name || a.income_slab}>{a.income_name || a.income_slab}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Religion</label>
                                        <select name="religion" value={formData.religion} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Religion</option>
                                            {masterData.religions.map(r => (
                                                <option key={r.id} value={r.religion_name}>{r.religion_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Caste Name</label>
                                        <input type="text" name="casteName" value={formData.casteName} onChange={handleChange} className={styles.inputField} placeholder="Caste Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Gender</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: COMMUNICATION */}
                        {activeFormTab === 3 && (
                            <div className={styles.formCard}>
                                <div className={styles.cardSectionTitle}>Communication & Address</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Student E Mail</label>
                                        <input type="email" name="studentEmail" value={formData.studentEmail} onChange={handleChange} className={styles.inputField} placeholder="student.name@gmail.com" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Address 1</label>
                                        <input type="text" name="address1" value={formData.address1} onChange={handleChange} className={styles.inputField} placeholder="Door No / Street" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Address 2</label>
                                        <input type="text" name="address2" value={formData.address2} onChange={handleChange} className={styles.inputField} placeholder="Area / Landmark" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Pincode</label>
                                        <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={styles.inputField} placeholder="638001" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Country</label>
                                        <input type="text" name="country" value={formData.country} readOnly className={styles.inputField} style={{ backgroundColor: '#f1f5f9' }} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>State</label>
                                        <input type="text" name="state" value={formData.state} readOnly className={styles.inputField} style={{ backgroundColor: '#f1f5f9' }} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>District</label>
                                        <select name="district" value={formData.district} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select District</option>
                                            {masterData.districts.map(d => <option key={d.id} value={d.district_name}>{d.district_name}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>City</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} className={styles.inputField} placeholder="City / Town" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: 10TH DETAILS */}
                        {activeFormTab === 4 && (
                            <div className={styles.formCard}>
                                <div className={styles.cardSectionTitle}>10th Academic Information</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>10th School District</label>
                                        <select name="tenthSchoolDistrict" value={formData.tenthSchoolDistrict} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select School District</option>
                                            {masterData.districts.map(d => <option key={d.id} value={d.district_name}>{d.district_name}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>10 School City</label>
                                        <input type="text" name="tenthSchoolCity" value={formData.tenthSchoolCity} onChange={handleChange} className={styles.inputField} placeholder="School City" />
                                    </div>
                                    <div className={styles.inputGroup} style={{ position: 'relative' }}>
                                        <label className={styles.inputLabel}>10th School</label>
                                        <input 
                                            type="text" 
                                            name="tenthSchool" 
                                            value={formData.tenthSchool} 
                                            onChange={handleChange} 
                                            className={styles.inputField} 
                                            placeholder="School Name" 
                                            autoComplete="off"
                                            onFocus={(e) => {
                                                const val = e.target.value;
                                                const district = formData.tenthSchoolDistrict || '';
                                                const city = formData.tenthSchoolCity || '';
                                                let filtered = masterData.schools || [];
                                                if (district) {
                                                    filtered = filtered.filter(s => (s.district_name || '').toLowerCase() === district.toLowerCase());
                                                }
                                                if (city) {
                                                    filtered = filtered.filter(s => (s.city || '').toLowerCase().includes(city.toLowerCase()));
                                                }
                                                if (val.trim().length > 0) {
                                                    filtered = filtered.filter(s => (s.school_name || '').toLowerCase().includes(val.toLowerCase()));
                                                }
                                                setTenthSchoolSuggestions(filtered);
                                                setShowTenthSuggestions(true);
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const val = e.target.value;
                                                const district = formData.tenthSchoolDistrict || '';
                                                const city = formData.tenthSchoolCity || '';
                                                let filtered = masterData.schools || [];
                                                if (district) {
                                                    filtered = filtered.filter(s => (s.district_name || '').toLowerCase() === district.toLowerCase());
                                                }
                                                if (city) {
                                                    filtered = filtered.filter(s => (s.city || '').toLowerCase().includes(city.toLowerCase()));
                                                }
                                                if (val.trim().length > 0) {
                                                    filtered = filtered.filter(s => (s.school_name || '').toLowerCase().includes(val.toLowerCase()));
                                                }
                                                setTenthSchoolSuggestions(filtered);
                                                setShowTenthSuggestions(true);
                                            }}
                                        />
                                        {showTenthSuggestions && tenthSchoolSuggestions.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '0.375rem',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                zIndex: 999,
                                                maxHeight: '180px',
                                                overflowY: 'auto',
                                                marginTop: '0.25rem'
                                            }} onClick={(e) => e.stopPropagation()}>
                                                {tenthSchoolSuggestions.map((school, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                tenthSchool: school.school_name
                                                            }));
                                                            setShowTenthSuggestions(false);
                                                        }}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            cursor: 'pointer',
                                                            borderBottom: idx === tenthSchoolSuggestions.length - 1 ? 'none' : '1px solid #f1f5f9',
                                                            color: '#1e293b',
                                                            fontSize: '0.875rem',
                                                            textAlign: 'left'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div style={{ fontWeight: '500' }}>{school.school_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{school.city}, {school.district_name}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>10th Mark</label>
                                        <input type="number" name="tenthMark" value={formData.tenthMark} onChange={handleChange} className={styles.inputField} placeholder="Obtained Marks" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Reg No 10th</label>
                                        <input type="text" name="regNo10th" value={formData.regNo10th} onChange={handleChange} className={styles.inputField} placeholder="10th Registration Number" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Total Marks in 10th</label>
                                        <input type="number" name="totalMarks10th" value={formData.totalMarks10th} onChange={handleChange} className={styles.inputField} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Percentage 10th</label>
                                        <input type="text" name="percentage10th" value={formData.percentage10th} onChange={handleChange} className={styles.inputField} placeholder="e.g. 85%" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>10th YOP</label>
                                        <input type="number" name="tenthYOP" value={formData.tenthYOP} onChange={handleChange} className={styles.inputField} placeholder="Year of Passing" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: 12TH DETAILS */}
                        {activeFormTab === 5 && (
                            <div className={styles.formCard}>
                                <div className={styles.cardSectionTitle}>12th Academic Information</div>
                                <div className={styles.formGrid} style={{ marginBottom: '2rem' }}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>12 school District</label>
                                        <select name="twelfthSchoolDistrict" value={formData.twelfthSchoolDistrict} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select School District</option>
                                            {masterData.districts.map(d => <option key={d.id} value={d.district_name}>{d.district_name}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>12 school City</label>
                                        <input type="text" name="twelfthSchoolCity" value={formData.twelfthSchoolCity} onChange={handleChange} className={styles.inputField} placeholder="School City" />
                                    </div>
                                    <div className={styles.inputGroup} style={{ position: 'relative' }}>
                                        <label className={styles.inputLabel}>12th School</label>
                                        <input 
                                            type="text" 
                                            name="twelfthSchool" 
                                            value={formData.twelfthSchool} 
                                            onChange={handleChange} 
                                            className={styles.inputField} 
                                            placeholder="School Name" 
                                            autoComplete="off"
                                            onFocus={(e) => {
                                                const val = e.target.value;
                                                const district = formData.twelfthSchoolDistrict || '';
                                                const city = formData.twelfthSchoolCity || '';
                                                let filtered = masterData.schools || [];
                                                if (district) {
                                                    filtered = filtered.filter(s => (s.district_name || '').toLowerCase() === district.toLowerCase());
                                                }
                                                if (city) {
                                                    filtered = filtered.filter(s => (s.city || '').toLowerCase().includes(city.toLowerCase()));
                                                }
                                                if (val.trim().length > 0) {
                                                    filtered = filtered.filter(s => (s.school_name || '').toLowerCase().includes(val.toLowerCase()));
                                                }
                                                setTwelfthSchoolSuggestions(filtered);
                                                setShowTwelfthSuggestions(true);
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const val = e.target.value;
                                                const district = formData.twelfthSchoolDistrict || '';
                                                const city = formData.twelfthSchoolCity || '';
                                                let filtered = masterData.schools || [];
                                                if (district) {
                                                    filtered = filtered.filter(s => (s.district_name || '').toLowerCase() === district.toLowerCase());
                                                }
                                                if (city) {
                                                    filtered = filtered.filter(s => (s.city || '').toLowerCase().includes(city.toLowerCase()));
                                                }
                                                if (val.trim().length > 0) {
                                                    filtered = filtered.filter(s => (s.school_name || '').toLowerCase().includes(val.toLowerCase()));
                                                }
                                                setTwelfthSchoolSuggestions(filtered);
                                                setShowTwelfthSuggestions(true);
                                            }}
                                        />
                                        {showTwelfthSuggestions && twelfthSchoolSuggestions.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '0.375rem',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                zIndex: 999,
                                                maxHeight: '180px',
                                                overflowY: 'auto',
                                                marginTop: '0.25rem'
                                            }} onClick={(e) => e.stopPropagation()}>
                                                {twelfthSchoolSuggestions.map((school, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                twelfthSchool: school.school_name
                                                            }));
                                                            setShowTwelfthSuggestions(false);
                                                        }}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            cursor: 'pointer',
                                                            borderBottom: idx === twelfthSchoolSuggestions.length - 1 ? 'none' : '1px solid #f1f5f9',
                                                            color: '#1e293b',
                                                            fontSize: '0.875rem',
                                                            textAlign: 'left'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div style={{ fontWeight: '500' }}>{school.school_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{school.city}, {school.district_name}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>12 Mark Sheet Given Status <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="twelfthMarkSheetStatus" value={formData.twelfthMarkSheetStatus} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>12th YOP</label>
                                        <input type="number" name="twelfthYOP" value={formData.twelfthYOP} onChange={handleChange} className={styles.inputField} placeholder="Year of Passing" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Group in 12th <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="twelfthGroup" value={formData.twelfthGroup} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Group</option>
                                            {masterData.groups12th.map(g => <option key={g.id} value={g.group_name}>{g.group_name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.cardSectionTitle} style={{ marginTop: '2rem' }}>Subject Wise Marks (Out of 100 Each)</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 1 Name</label>
                                        <input type="text" name="subject1Name" value={formData.subject1Name} onChange={handleChange} className={styles.inputField} placeholder="Subject 1 Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 1 12th Mark</label>
                                        <input type="number" name="subject1Mark" value={formData.subject1Mark} onChange={handleChange} className={styles.inputField} placeholder="Subject 1 Mark" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 2 Name</label>
                                        <input type="text" name="subject2Name" value={formData.subject2Name} onChange={handleChange} className={styles.inputField} placeholder="Subject 2 Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 2 12th Mark</label>
                                        <input type="number" name="englishMark" value={formData.englishMark} onChange={handleChange} className={styles.inputField} placeholder="Subject 2 Mark" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 3 Name</label>
                                        <input type="text" name="subject3Name" value={formData.subject3Name} onChange={handleChange} className={styles.inputField} placeholder="Subject 3 Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 3 12th Mark</label>
                                        <input type="number" name="subject2Mark" value={formData.subject2Mark} onChange={handleChange} className={styles.inputField} placeholder="Subject 3 Mark" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 4 Name</label>
                                        <input type="text" name="subject4Name" value={formData.subject4Name} onChange={handleChange} className={styles.inputField} placeholder="Subject 4 Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 4 12th Mark</label>
                                        <input type="number" name="subject3Mark" value={formData.subject3Mark} onChange={handleChange} className={styles.inputField} placeholder="Subject 4 Mark" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 5 Name</label>
                                        <input type="text" name="subject5Name" value={formData.subject5Name} onChange={handleChange} className={styles.inputField} placeholder="Subject 5 Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 5 12th Mark</label>
                                        <input type="number" name="subject4Mark" value={formData.subject4Mark} onChange={handleChange} className={styles.inputField} placeholder="Subject 5 Mark" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 6 Name</label>
                                        <input type="text" name="subject6Name" value={formData.subject6Name} onChange={handleChange} className={styles.inputField} placeholder="Subject 6 Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject 6 12th Mark</label>
                                        <input type="number" name="subject5Mark" value={formData.subject5Mark} onChange={handleChange} className={styles.inputField} placeholder="Subject 6 Mark" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Total Marks in 12th</label>
                                        <input type="text" name="totalMarks12th" value={formData.totalMarks12th} readOnly className={styles.inputField} style={{ backgroundColor: '#f1f5f9' }} placeholder="Calculated" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Percentage 12th</label>
                                        <input type="text" name="percentage12th" value={formData.percentage12th} readOnly className={styles.inputField} style={{ backgroundColor: '#f1f5f9' }} placeholder="Calculated" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 6: UG DETAILS */}
                        {activeFormTab === 6 && (
                            <div className={styles.formCard}>
                                <div className={styles.cardSectionTitle}>UG Academic Information (For PG Admission)</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>UG University</label>
                                        <input type="text" name="ugUniversity" value={formData.ugUniversity} onChange={handleChange} className={styles.inputField} placeholder="e.g. Anna University / Bharathiar University" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 7: REFERENCE DETAILS */}
                        {activeFormTab === 7 && (
                            <div className={styles.formCard}>
                                <div className={styles.cardSectionTitle}>Reference & Source of Information</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Reference Type <span className={styles.requiredAsterisk}>*</span></label>
                                        <select name="referenceType" value={formData.referenceType} onChange={handleChange} required className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Reference</option>
                                            {masterData.referenceTypes.map(r => <option key={r.id} value={r.reference_type}>{r.reference_type}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>reference college</label>
                                        {formData.referenceType === 'Staff' ? (
                                            <select name="referenceCollege" value={formData.referenceCollege} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                                <option value="">Select College</option>
                                                {staffInstitutions.map((inst, idx) => (
                                                    <option key={idx} value={inst}>{inst}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input type="text" name="referenceCollege" value={formData.referenceCollege} onChange={handleChange} className={styles.inputField} placeholder="Referenced College Name" />
                                        )}
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>reference department</label>
                                        {formData.referenceType === 'Staff' ? (
                                            <select name="referenceDepartment" value={formData.referenceDepartment} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                                <option value="">Select Department</option>
                                                {staffDepartments.map((dept, idx) => (
                                                    <option key={idx} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input type="text" name="referenceDepartment" value={formData.referenceDepartment} onChange={handleChange} className={styles.inputField} placeholder="Referenced Dept" />
                                        )}
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Reference By Name</label>
                                        {formData.referenceType === 'Staff' ? (
                                            <select name="referenceByName" value={formData.referenceByName} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                                <option value="">Select Staff Name</option>
                                                {staffMembers.map((member, idx) => (
                                                    <option key={idx} value={member.staff_name}>{member.staff_name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input type="text" name="referenceByName" value={formData.referenceByName} onChange={handleChange} className={styles.inputField} placeholder="Referrer Name" />
                                        )}
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Reference By Mobile</label>
                                        <input type="tel" name="referenceByMobile" value={formData.referenceByMobile} onChange={handleChange} className={styles.inputField} placeholder="Referrer Mobile" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Consultancy Name</label>
                                        <select name="consultancyName" value={formData.consultancyName} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="">Select Consultancy</option>
                                            {consultancyList.map((c, idx) => (
                                                <option key={idx} value={c.consultancy_name}>{c.consultancy_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Consultancy Person Name</label>
                                        <input type="text" name="consultancyPersonName" value={formData.consultancyPersonName} onChange={handleChange} className={styles.inputField} placeholder="Agent Name" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Consultancy Mobile</label>
                                        <input type="tel" name="consultancyMobile" value={formData.consultancyMobile} onChange={handleChange} className={styles.inputField} placeholder="Agent Mobile" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 8: LAST STUDIED */}
                        {activeFormTab === 8 && (
                            <div className={styles.formCard}>
                                <div className={styles.cardSectionTitle}>Prior Schooling Information</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Course Studied</label>
                                        <input type="text" name="courseStudied" value={formData.courseStudied} onChange={handleChange} className={styles.inputField} placeholder="e.g. HSC (General) / Diploma" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Medium</label>
                                        <select name="medium" value={formData.medium} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option value="English">English</option>
                                            <option value="Tamil">Tamil</option>
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>board University</label>
                                        <input type="text" name="boardUniversity" value={formData.boardUniversity} onChange={handleChange} className={styles.inputField} placeholder="e.g. State Board / CBSE" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Nativity</label>
                                        <input type="text" name="nativity" value={formData.nativity} onChange={handleChange} className={styles.inputField} placeholder="State of Origin" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FORM ACTION CONTROL BUTTONS */}
                        <div className={styles.formActions}>
                            {activeFormTab > 1 ? (
                                <button
                                    type="button"
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    onClick={() => setActiveFormTab(prev => prev - 1)}
                                >
                                    <ArrowLeft size={16} /> Previous
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    onClick={handleResetForm}
                                >
                                    <RotateCcw size={16} /> Clear Form
                                </button>
                            )}

                            {activeFormTab < 8 ? (
                                <button
                                    type="button"
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    onClick={() => setActiveFormTab(prev => prev + 1)}
                                >
                                    Next <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className={`${styles.btn} ${styles.btnSuccess}`}
                                >
                                    <CheckCircle size={16} /> Final Submit Application
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* 2. STAFF VIEW PORTAL */}
                {activeSection === 'staff' && (
                    <div>
                        <div className={styles.pageHeader}>
                            <h1 className={styles.pageTitle}>Admitted Student Register (Staff View)</h1>
                            <p className={styles.pageDescription}>Real-time college ERP view to query, filter, and review completed admission entries.</p>
                        </div>

                        {/* FILTER & SEARCH BAR */}
                        <div className={styles.filterBar}>
                            <div className={styles.searchContainer}>
                                <Search size={18} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Search by ID, Name, RegNo, Mobile..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={styles.searchInput}
                                />
                            </div>

                            <div className={styles.filterControls}>
                                <select 
                                    className={`${styles.inputField} ${styles.selectField}`} 
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                    value={deptFilter}
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                >
                                    <option value="">All Departments</option>
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                                    <option value="Electrical Engineering">Electrical Engineering</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                </select>
                            </div>
                        </div>

                        {/* STUDENT LIST TABLE */}
                        <div className={styles.tableContainer}>
                            <table className={styles.erpTable}>
                                <thead>
                                    <tr>
                                        <th>Application ID</th>
                                        <th>Student Name</th>
                                        <th>Reg No</th>
                                        <th>Aadhar</th>
                                        <th>Department</th>
                                        <th>Reference Type</th>
                                        <th>Contact Mobile</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map(student => (
                                            <tr key={student.id}>
                                                <td style={{ fontWeight: '600', color: '#1e3a8a' }}>{student.id}</td>
                                                <td style={{ fontWeight: '500' }}>{student.name}</td>
                                                <td>{student.regno}</td>
                                                <td>{student.aadhar}</td>
                                                <td>{student.dept}</td>
                                                <td>
                                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#f1f5f9', fontSize: '0.75rem', fontWeight: '600' }}>
                                                        {student.type}
                                                    </span>
                                                </td>
                                                <td>{student.mobile}</td>
                                                <td>
                                                    <span style={{ 
                                                        padding: '0.2rem 0.5rem', 
                                                        borderRadius: '30px', 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: '700',
                                                        backgroundColor: student.status === 'Admitted' ? '#ecfdf5' : student.status === 'Pending' ? '#fffbeb' : '#fef2f2',
                                                        color: student.status === 'Admitted' ? '#047857' : student.status === 'Pending' ? '#b45309' : '#b91c1c'
                                                    }}>
                                                        {student.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                                        title="View Details"
                                                        onClick={() => toast(`Viewing profile of ${student.name} (${student.id})`, { icon: '🧑‍🎓' })}
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                    <button 
                                                        className={styles.actionBtn}
                                                        title="Edit Entry"
                                                        onClick={() => {
                                                            toast.success(`Loading ${student.name} profile into editor...`);
                                                            setActiveSection('entry');
                                                        }}
                                                    >
                                                        <RotateCcw size={14} style={{ transform: 'rotate(90deg)' }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                                <AlertCircle size={32} style={{ margin: '0 auto 0.5rem auto', display: 'block', color: '#cbd5e1' }} />
                                                No admitted student records match your query.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. CERTIFICATE ENTRY PORTAL */}
                {activeSection === 'certificates' && (
                    <div>
                        <div className={styles.pageHeader}>
                            <h1 className={styles.pageTitle}>Admitted Student Certificate Entry</h1>
                            <p className={styles.pageDescription}>Upload scanned files and verify mandatory student certificates for record compliance.</p>
                        </div>

                        {/* COMPLIANCE CERTIFICATE UPLOAD GRID */}
                        <div className={styles.uploadGrid}>
                            {[
                                { key: 'tenthMarksheet', title: '10th Marksheet', subtitle: 'Max Size: 2MB (PDF/JPG)' },
                                { key: 'twelfthMarksheet', title: '12th Marksheet', subtitle: 'Max Size: 2MB (PDF/JPG)' },
                                { key: 'transferCertificate', title: 'Transfer Certificate (TC)', subtitle: 'Max Size: 2MB (PDF/JPG)' },
                                { key: 'communityCertificate', title: 'Community Certificate', subtitle: 'Max Size: 1MB (PDF/JPG)' },
                                { key: 'aadharCard', title: 'Aadhar Card Copy', subtitle: 'Max Size: 1MB (PDF/JPG)' },
                                { key: 'ugDegree', title: 'UG Provisional / Degree', subtitle: 'Max Size: 3MB (PDF/JPG)' }
                            ].map(cert => (
                                <div key={cert.key} className={styles.uploadCard}>
                                    <div className={styles.uploadIconWrapper}>
                                        <UploadCloud size={24} />
                                    </div>
                                    <div className={styles.uploadTitle}>{cert.title}</div>
                                    <div className={styles.uploadSubtitle}>{cert.subtitle}</div>

                                    {/* Simulated Upload Preview */}
                                    {uploadedFiles[cert.key] ? (
                                        <div className={styles.filePreviewContainer}>
                                            <Check size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                            <div className={styles.fileDetails}>
                                                <div className={styles.fileName}>{uploadedFiles[cert.key].name}</div>
                                                <div className={styles.fileSize}>{uploadedFiles[cert.key].size}</div>
                                            </div>
                                            <button 
                                                type="button" 
                                                className={styles.removeFileBtn}
                                                onClick={() => handleRemoveFile(cert.key)}
                                                title="Delete File"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className={`${styles.btn} ${styles.btnPrimary}`} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                                            <FileUp size={14} /> Upload File
                                            <input 
                                                type="file" 
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className={styles.fileInputHidden}
                                                onChange={(e) => handleFileChange(e, cert.key)}
                                            />
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default AdmissionProcess;
