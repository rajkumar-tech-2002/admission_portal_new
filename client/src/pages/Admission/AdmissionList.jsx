import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, UserPlus, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/Dashboard.module.css';
import reportStyles from '../../components/css/RecordReport.module.css';
import { formatDate, formatDateTime } from '../../utils/dateFormatter';
import toast from 'react-hot-toast';
import { confirmAction } from '../../components/layout/Toast';
import apiService from '../../services/api.service';

const AdmissionList = ({ admissions, onAdd, onEdit, onDelete, onRefresh, viewOnly }) => {
    const fileInputRef = useRef(null);
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);
    
    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [quotaFilter, setQuotaFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [collegeFilter, setCollegeFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');

    // Helper: build display department (programme - department or just department)
    const getDisplayDept = (record) => {
        const prog = (record.programme || '').trim();
        const dept = (record.department || '').trim();
        if (prog) return `${prog} - ${dept}`;
        return dept;
    };

    // Compute distinct filter options from ALL admissions data
    const distinctStatuses = useMemo(() => {
        const set = new Set();
        admissions.forEach(r => { if (r.student_status) set.add(r.student_status); });
        return [...set].sort();
    }, [admissions]);

    const distinctQuotas = useMemo(() => {
        const set = new Set();
        admissions.forEach(r => { if (r.quota) set.add(r.quota); });
        return [...set].sort();
    }, [admissions]);

    const distinctYears = useMemo(() => {
        const set = new Set();
        admissions.forEach(r => { if (r.admission_year) set.add(r.admission_year); });
        return [...set].sort();
    }, [admissions]);

    const distinctColleges = useMemo(() => {
        const set = new Set();
        admissions.forEach(r => { if (r.college) set.add(r.college); });
        return [...set].sort();
    }, [admissions]);

    const distinctDepts = useMemo(() => {
        const set = new Set();
        admissions.forEach(r => {
            const display = getDisplayDept(r);
            if (display) set.add(display);
        });
        return [...set].sort();
    }, [admissions]);

    const [filteredRecords, setFilteredRecords] = useState([]);

    useEffect(() => {
        let result = admissions;

        // Apply Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(r => 
                (r.application_no || '').toLowerCase().includes(lowerSearch) ||
                (r.student_name || '').toLowerCase().includes(lowerSearch) ||
                (r.reg_no_12th || '').toLowerCase().includes(lowerSearch) ||
                (r.aadhaar_no || '').toLowerCase().includes(lowerSearch) ||
                (r.student_mobile_no || '').toLowerCase().includes(lowerSearch)
            );
        }

        // Apply Status
        if (status) {
            result = result.filter(r => r.student_status === status);
        }

        // Apply Quota
        if (quotaFilter) {
            result = result.filter(r => r.quota === quotaFilter);
        }

        // Apply Year
        if (yearFilter) {
            result = result.filter(r => String(r.admission_year) === String(yearFilter));
        }

        // Apply College
        if (collegeFilter) {
            result = result.filter(r => r.college === collegeFilter);
        }

        // Apply Department (combined display)
        if (deptFilter) {
            result = result.filter(r => getDisplayDept(r) === deptFilter);
        }

        // Apply Dates
        if (fromDate) {
            result = result.filter(r => new Date(r.admission_date || r.created_at) >= new Date(fromDate));
        }
        if (toDate) {
            const nextDay = new Date(toDate);
            nextDay.setDate(nextDay.getDate() + 1);
            result = result.filter(r => new Date(r.admission_date || r.created_at) < nextDay);
        }

        setFilteredRecords(result);
        setCurrentPage(1);
    }, [admissions, search, status, fromDate, toDate, quotaFilter, yearFilter, collegeFilter, deptFilter]);

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleResetFilters = () => {
        setSearch('');
        setStatus('');
        setFromDate('');
        setToDate('');
        setQuotaFilter('');
        setYearFilter('');
        setCollegeFilter('');
        setDeptFilter('');
        setCurrentPage(1);
    };


    const importColumns = [
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
        'consultancy_person_name', 'consultancy_mobile', 'course_studied', 'studied_medium', 'board_university', 'nativity',
        'consortium_number', 'consortium_batch', 'consortium_rank', 'counselling_number', 'counselling_round'
    ];

    const handleExportTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([importColumns]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Admission_Import_Template.xlsx");
    };

    const handleExportRecords = () => {
        if (filteredRecords.length === 0) return toast.error("No records to export");
        const exportData = filteredRecords.map(r => {
            const row = {};
            importColumns.forEach(col => {
                row[col] = r[col] || '';
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Admissions");
        XLSX.writeFile(wb, `Admissions_Export_${new Date().getTime()}.xlsx`);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd', defval: null });
                
                if (data.length === 0) return toast.error("Empty file");

                const loadingToast = toast.loading('Importing records...');
                const response = await apiService.post('/admissions/import', { records: data });
                
                if (response.data.success) {
                    toast.success(`Successfully imported ${response.data.result?.imported || 0} records`, { id: loadingToast });
                    if (onRefresh) onRefresh();
                } else {
                    toast.error(response.data.message || 'Import failed', { id: loadingToast });
                }
            } catch (err) {
                console.error(err);
                toast.error('Error importing file');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Admission Records</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {!viewOnly && (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" style={{ display: 'none' }} />
                                <button onClick={() => fileInputRef.current.click()} className={styles.exportBtn} style={{ background: '#10b981', color: '#fff', border: 'none' }}>
                                    <Upload size={18} /> Import Excel
                                </button>
                                <button onClick={handleExportTemplate} className={styles.exportBtn}>
                                    <Download size={18} /> Template
                                </button>
                            </>
                        )}
                        <button onClick={handleExportRecords} className={styles.exportBtn}>
                            <Download size={18} /> Export
                        </button>
                        {!viewOnly && (
                            <button onClick={onAdd} className={styles.exportBtn} style={{ background: 'var(--primary-color)', color: '#fff', border: 'none' }}>
                                <Plus size={18} /> Add Application
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Global Search</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                className={styles.searchInput} 
                                placeholder="Search name, app no, regno, aadhaar, mobile..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search size={16} style={{ position: 'absolute', right: 10, top: 10, color: '#9ca3af' }}/>
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>From Date</label>
                        <input 
                            type="date" 
                            className={styles.dateInput}
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>To Date</label>
                        <input 
                            type="date" 
                            className={styles.dateInput}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>College</label>
                        <select 
                            className={styles.selectInput}
                            value={collegeFilter}
                            onChange={(e) => {
                                setCollegeFilter(e.target.value);
                                setDeptFilter(''); // Reset dept when college changes
                            }}
                        >
                            <option value="">All Colleges</option>
                            {distinctColleges.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Department</label>
                        <select 
                            className={styles.selectInput}
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {distinctDepts
                                .filter(d => {
                                    if (!collegeFilter) return true;
                                    // If college is selected, only show depts for that college
                                    // This requires looking back at admissions data
                                    return admissions.some(r => r.college === collegeFilter && getDisplayDept(r) === d);
                                })
                                .map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status</label>
                        <select 
                            className={styles.selectInput}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {distinctStatuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Quota</label>
                        <select 
                            className={styles.selectInput}
                            value={quotaFilter}
                            onChange={(e) => setQuotaFilter(e.target.value)}
                        >
                            <option value="">All Quotas</option>
                            {distinctQuotas.map(q => (
                                <option key={q} value={q}>{q}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Year</label>
                        <select 
                            className={styles.selectInput}
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                        >
                            <option value="">All Years</option>
                            {distinctYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.resetRow} style={{ marginBottom: '1rem' }}>
                    <button onClick={handleResetFilters} className={styles.resetFiltersBtn}>
                        Reset All Filters
                    </button>
                </div>

                <div className={styles.tableControls}>
                    <div className={styles.limitSelector}>
                        <label>Show</label>
                        <select 
                            value={recordsPerPage} 
                            onChange={(e) => {
                                setRecordsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className={styles.limitSelect}
                        >
                            <option value={100}>100</option>
                            <option value={150}>150</option>
                            <option value={200}>200</option>
                            <option value={250}>250</option>
                        </select>
                        <label>entries</label>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {!viewOnly && <th>Action</th>}
                                <th>12 Reg.Number</th>
                                <th>Application Number</th>
                                <th>Application Date</th>
                                <th>Status</th>
                                <th>Student Name</th>
                                <th>College</th>
                                <th>Department</th>
                                <th>Year</th>
                                <th>Quota</th>
                                <th>Communication</th>
                                <th>DOB</th>
                                <th>Father Mobile</th>
                                <th>Student Mobile</th>
                                <th>Fees</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRecords.length > 0 ? (
                                currentRecords.map((record, index) => (
                                    <tr key={record.id}>
                                        {!viewOnly && (
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button 
                                                    className={styles.editBtn}
                                                    onClick={() => onEdit(record)}
                                                    title="Edit Record"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        )}
                                        <td>{record.reg_no_12th}</td>
                                        <td><strong>{record.application_no}</strong></td>
                                        <td>{record.admission_date ? record.admission_date.substring(0, 10).split('-').reverse().join('-') : ''}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles['status-' + record.student_status]}`}>
                                                {record.student_status}
                                            </span>
                                        </td>
                                        <td>{record.student_name}</td>
                                        <td>{record.college}</td>
                                        <td>{getDisplayDept(record)}</td>
                                        <td>{record.admission_year}</td>
                                        <td>{record.quota}</td>
                                        <td>{record.city || record.district || ''}</td>
                                        <td>{record.dob ? record.dob.substring(0, 10).split('-').reverse().join('-') : ''}</td>
                                        <td>{record.father_mobile_no}</td>
                                        <td>{record.student_mobile_no}</td>
                                        <td>{record.fee}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                     <td colSpan="15" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredRecords.length > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} entries
                        </div>
                        <div className={styles.paginationControls}>
                            <button 
                                className={styles.pageBtn} 
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                <button
                                    key={number}
                                    className={`${styles.pageBtn} ${currentPage === number ? styles.activePage : ''}`}
                                    onClick={() => paginate(number)}
                                >
                                    {number}
                                </button>
                            ))}
                            <button 
                                className={styles.pageBtn} 
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdmissionList;
