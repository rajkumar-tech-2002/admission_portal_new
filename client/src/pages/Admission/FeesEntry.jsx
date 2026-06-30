import React, { useState, useEffect } from 'react';
import { Save, Search, Plus, ArrowLeft, FileCheck, Edit, Download } from 'lucide-react';
import styles from '../../components/css/Dashboard.module.css';
import reportStyles from '../../components/css/RecordReport.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';
import { confirmAction } from '../../components/layout/Toast';
import { formatDate, formatDateForInput } from '../../utils/dateFormatter';

const FeesEntry = () => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    
    // Dropdown Data
    const [colleges, setColleges] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [years, setYears] = useState([]);
    
    // Master data cache
    const [allDepts, setAllDepts] = useState([]);

    // Fees List Table State
    const [feesRecords, setFeesRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);
    
    // List Filters
    const [listSearch, setListSearch] = useState('');
    const [listCollegeFilter, setListCollegeFilter] = useState('');
    const [listDeptFilter, setListDeptFilter] = useState('');
    const [listQuotaFilter, setListQuotaFilter] = useState('');
    const [listYearFilter, setListYearFilter] = useState('');
    const [listPaymentModeFilter, setListPaymentModeFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [filteredFeesRecords, setFilteredFeesRecords] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        college: '',
        department: '',
        programme: '',
        year_type: '',
        student_name: '',
        student_application_no: '',
        student_dob: '',
        paid_amount: '',
        payment_mode: 'Cash',
        if_return: 'No',
        paid_date: new Date().toISOString().split('T')[0]
    });

    // Autocomplete State
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [studentsList, setStudentsList] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        fetchMasterData();
        fetchFeesRecords();
    }, []);

    const fetchMasterData = async () => {
        try {
            const res = await apiService.get('/master');
            if (res.data.success) {
                const data = res.data.data;
                const fetchedDepts = data.departments || [];
                setAllDepts(fetchedDepts);
                
                const uniqueColleges = [...new Set(fetchedDepts.map(d => d.institution).filter(Boolean))];
                setColleges(uniqueColleges);
                setYears(data.admissionYears || []);
            }
        } catch (error) {
            console.error('Error fetching master data:', error);
            toast.error('Failed to load dropdown data');
        }
    };

    const fetchFeesRecords = async () => {
        setLoading(true);
        try {
            const res = await apiService.get('/admissions/fees/list');
            if (res.data.success) {
                setFeesRecords(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching fees list:', error);
            toast.error('Failed to load fees list');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic for Table
    useEffect(() => {
        let result = feesRecords;

        if (listSearch) {
            const lowerSearch = listSearch.toLowerCase();
            result = result.filter(r => 
                (r.student_name || '').toLowerCase().includes(lowerSearch) ||
                (r.student_application_no || '').toLowerCase().includes(lowerSearch)
            );
        }

        if (listCollegeFilter) {
            result = result.filter(r => r.college === listCollegeFilter);
        }

        if (listDeptFilter) {
            result = result.filter(r => {
                const deptDisplay = (r.programme && r.programme.trim()) ? `${r.programme} - ${r.department}` : (r.department || '');
                return deptDisplay === listDeptFilter;
            });
        }

        if (listQuotaFilter) result = result.filter(r => r.quota === listQuotaFilter);
        if (listYearFilter) result = result.filter(r => r.year_type === listYearFilter);
        if (listPaymentModeFilter) result = result.filter(r => (r.payment_mode || 'Cash') === listPaymentModeFilter);

        if (fromDate) {
            result = result.filter(r => new Date(r.paid_date || r.created_at) >= new Date(fromDate));
        }
        if (toDate) {
            const nextDay = new Date(toDate);
            nextDay.setDate(nextDay.getDate() + 1);
            result = result.filter(r => new Date(r.paid_date || r.created_at) < nextDay);
        }

        setFilteredFeesRecords(result);
        setCurrentPage(1);
        }, [feesRecords, listSearch, listCollegeFilter, listDeptFilter, listQuotaFilter, listYearFilter, fromDate, toDate, listPaymentModeFilter]);

    const handleResetListFilters = () => {
        setListSearch('');
        setListCollegeFilter('');
        setListDeptFilter('');
        setListQuotaFilter('');
        setListYearFilter('');
        setListPaymentModeFilter('');
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
    };

    // Excel Export for Payment List
    const handleExcelExport = () => {
        if (filteredFeesRecords.length === 0) { toast.error('No records to export'); return; }
        const headers = ['S.No','App No','Student Name','College','Quota','Programme','Department','Year','Paid Amount','Payment Mode','Paid Date','Refund?'];
        const rows = filteredFeesRecords.map((r, i) => [
            i + 1,
            r.student_application_no,
            r.student_name,
            r.college,
            r.quota || '',
            r.programme || '',
            r.department,
            r.year_type,
            r.paid_amount,
            r.payment_mode || 'Cash',
            r.paid_date ? r.paid_date.substring(0, 10).split('-').reverse().join('-') : '',
            r.if_return || 'No'
        ]);
        const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'payment_list.csv'; a.click();
        URL.revokeObjectURL(url);
        toast.success('Excel exported successfully!');
    };

    // Table Pagination
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredFeesRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredFeesRecords.length / recordsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Form Event Handlers
    const handleCollegeChange = (e) => {
        const college = e.target.value;
        setFormData(prev => ({ ...prev, college, department: '', programme: '', student_name: '', student_application_no: '' }));
        setStudentSearchTerm('');
        const filteredDepts = allDepts.filter(d => d.institution === college);
        setDepartments(filteredDepts); // Store full dept objects
    };

    const handleDepartmentChange = (e) => {
        const comboValue = e.target.value; // "ECE||B.E"
        const [dept, prog] = comboValue.split('||');
        setFormData(prev => ({ ...prev, department: dept || '', programme: prog || '', student_name: '', student_application_no: '' }));
        setStudentSearchTerm('');
    };

    const handleYearChange = (e) => {
        setFormData(prev => ({ ...prev, year_type: e.target.value, student_name: '', student_application_no: '' }));
        setStudentSearchTerm('');
    };

    // Autocomplete Logic
    useEffect(() => {
        const fetchStudents = async () => {
            if (studentSearchTerm.length > 0 && !formData.student_application_no) {
                try {
                    const params = new URLSearchParams();
                    if (formData.college) params.append('college', formData.college);
                    if (formData.department) params.append('department', formData.department);
                    if (formData.year_type) params.append('year', formData.year_type);

                    const res = await apiService.get(`/admissions/fees-students?${params.toString()}`);
                    if (res.data.success) {
                        const searchLower = studentSearchTerm.toLowerCase();
                        const filtered = res.data.data.filter(s => 
                            (s.student_name || '').toLowerCase().includes(searchLower) ||
                            (s.application_no || '').toLowerCase().includes(searchLower)
                        );
                        setStudentsList(filtered);
                        setShowSuggestions(true);
                    }
                } catch (error) {
                    console.error('Error fetching students:', error);
                }
            } else {
                setShowSuggestions(false);
            }
        };

        const timerId = setTimeout(() => {
            fetchStudents();
        }, 300);

        return () => clearTimeout(timerId);
    }, [studentSearchTerm, formData.college, formData.department, formData.year_type, formData.student_application_no]);

    const handleSelectStudent = (student) => {
        const dobStr = student.dob || '';
        setFormData(prev => ({
            ...prev,
            student_name: student.student_name,
            student_application_no: student.application_no,
            student_dob: dobStr,
            programme: student.programme || ''
        }));
        
        const dateStr = dobStr ? formatDate(dobStr) : 'N/A';
        setStudentSearchTerm(`${student.student_name} _ ${student.application_no} _ ${dateStr}`);
        setShowSuggestions(false);
    };

    const handleStudentSearchChange = (e) => {
        setStudentSearchTerm(e.target.value);
        if (formData.student_application_no) {
            setFormData(prev => ({ ...prev, student_name: '', student_application_no: '' }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!formData.student_application_no) {
            toast.error('Please select a valid student from the suggestions');
            return;
        }

        const amount = parseFloat(formData.paid_amount);
        if ((formData.if_return === 'No' || !formData.if_return) && amount < 0) {
            toast.error('Payment amount cannot be negative unless it is a refund.');
            return;
        }

        try {
            const res = await apiService.post('/admissions/fees/save', formData);
            if (res.data.success) {
                toast.success('Fees record saved successfully!');
                setFormData({
                    college: '',
                    department: '',
                    programme: '',
                    year_type: '',
                    student_name: '',
                    student_application_no: '',
                    student_dob: '',
                    paid_amount: '',
                    payment_mode: 'Cash',
                    if_return: 'No',
                    paid_date: new Date().toISOString().split('T')[0]
                });
                setStudentSearchTerm('');
                setIsFormVisible(false);
                fetchFeesRecords(); // Refresh table
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.message || 'Failed to save fees record');
        }
    };

    const handleEditFee = (record) => {
        const dob = record.student_dob || '';
        setFormData({
            id: record.id,
            college: record.college || '',
            department: record.department || '',
            programme: record.programme || '',
            year_type: record.year_type || '',
            student_name: record.student_name || '',
            student_application_no: record.student_application_no || '',
            student_dob: dob,
            paid_amount: record.paid_amount || '',
            payment_mode: record.payment_mode || 'Cash',
            if_return: record.if_return || 'No',
            paid_date: record.paid_date ? formatDateForInput(record.paid_date) : new Date().toISOString().split('T')[0]
        });
        
        const dobDisplay = dob ? ` _ ${formatDate(dob)}` : '';
        setStudentSearchTerm(`${record.student_name} _ ${record.student_application_no}${dobDisplay}`);
        
        const filteredDepts = allDepts.filter(d => d.institution === record.college);
        setDepartments(filteredDepts); // Store full dept objects for dropdown
        
        setIsFormVisible(true);
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                
                {/* Header Section */}
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileCheck size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>
                            {isFormVisible ? "Payment Entry" : "Payment List"}
                        </h2>
                    </div>
                    {isFormVisible ? (
                        <button 
                            onClick={() => setIsFormVisible(false)} 
                            className={styles.exportBtn} 
                            style={{ background: '#6b7280', color: '#fff', border: 'none' }}
                        >
                            <ArrowLeft size={18} /> Back to List
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsFormVisible(true)} 
                            className={styles.exportBtn} 
                            style={{ background: 'var(--primary-color)', color: '#fff', border: 'none' }}
                        >
                            <Plus size={18} /> New Payment
                        </button>
                    )}
                </div>

                {!isFormVisible ? (
                    // TABLE VIEW
                    <>
                        <div className={styles.filters}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Global Search</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        className={styles.searchInput} 
                                        placeholder="Search name, app no..."
                                        value={listSearch}
                                        onChange={(e) => setListSearch(e.target.value)}
                                    />
                                    <Search size={16} style={{ position: 'absolute', right: 10, top: 10, color: '#9ca3af' }}/>
                                </div>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>College</label>
                                <select 
                                    className={styles.selectInput}
                                    value={listCollegeFilter}
                                    onChange={(e) => {
                                        setListCollegeFilter(e.target.value);
                                        setListDeptFilter('');
                                    }}
                                >
                                    <option value="">All Colleges</option>
                                    {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Department</label>
                                <select 
                                    className={styles.selectInput}
                                    value={listDeptFilter}
                                    onChange={(e) => setListDeptFilter(e.target.value)}
                                >
                                    <option value="">All Departments</option>
                                    {feesRecords
                                        .filter(r => !listCollegeFilter || r.college === listCollegeFilter)
                                        .map(r => (r.programme && r.programme.trim()) ? `${r.programme} - ${r.department}` : (r.department || ''))
                                        .filter(Boolean)
                                        .filter((v, i, a) => a.indexOf(v) === i)
                                        .sort()
                                        .map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Quota</label>
                                <select 
                                    className={styles.selectInput}
                                    value={listQuotaFilter}
                                    onChange={(e) => setListQuotaFilter(e.target.value)}
                                >
                                    <option value="">All Quotas</option>
                                    <option value="COUNSELLING">COUNSELLING</option>
                                    <option value="MANAGEMENT">MANAGEMENT</option>
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Year</label>
                                <select 
                                    className={styles.selectInput}
                                    value={listYearFilter}
                                    onChange={(e) => setListYearFilter(e.target.value)}
                                >
                                    <option value="">All Years</option>
                                    {years.map(y => <option key={y.id || y.admission_year_name} value={y.admission_year_name}>{y.admission_year_name}</option>)}
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Payment Mode</label>
                                <select 
                                    className={styles.selectInput}
                                    value={listPaymentModeFilter}
                                    onChange={(e) => setListPaymentModeFilter(e.target.value)}
                                >
                                    <option value="">All Modes</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>From Date (Paid)</label>
                                <input 
                                    type="date" 
                                    className={styles.dateInput}
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>To Date (Paid)</label>
                                <input 
                                    type="date" 
                                    className={styles.dateInput}
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <button onClick={handleResetListFilters} className={styles.resetFiltersBtn}>
                                Reset All Filters
                            </button>
                            <button onClick={handleExcelExport} className={styles.exportBtn} style={{ background: '#10b981', color: '#fff', border: 'none' }}>
                                <Download size={18} /> Export Excel
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
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={150}>150</option>
                                </select>
                                <label>entries</label>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            {loading ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>Loading records...</div>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>S.No</th>
                                            <th>App No</th>
                                            <th>Student Name</th>
                                            <th>College</th>
                                            <th>Quota</th>
                                            <th>Department</th>
                                            <th>Year</th>
                                            <th>Paid Amount</th>
                                            <th>Payment Mode</th>
                                            <th>Paid Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRecords.length > 0 ? (
                                            currentRecords.map((record, index) => (
                                                <tr key={record.id}>
                                                    <td>{indexOfFirstRecord + index + 1}</td>
                                                    <td><strong>{record.student_application_no}</strong></td>
                                                    <td>{record.student_name}</td>
                                                    <td>{record.college}</td>
                                                    <td>{record.quota || '—'}</td>
                                                    <td>{(record.programme && record.programme.trim()) ? `${record.programme} - ${record.department}` : record.department}</td>
                                                    <td>{record.year_type}</td>
                                                    <td style={{ fontWeight: 'bold', color: record.if_return === 'Yes' ? '#ef4444' : '#059669' }}>
                                                        ₹{parseFloat(record.paid_amount || 0).toLocaleString()}
                                                        {record.if_return === 'Yes' && (
                                                            <span style={{ 
                                                                fontSize: '0.7rem', 
                                                                marginLeft: '6px', 
                                                                backgroundColor: '#fee2e2', 
                                                                color: '#ef4444', 
                                                                padding: '2px 6px', 
                                                                borderRadius: '4px',
                                                                border: '1px solid #fca5a5',
                                                                verticalAlign: 'middle',
                                                                display: 'inline-block'
                                                            }}>
                                                                Refund
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>{record.payment_mode || 'Cash'}</td>
                                                    <td>{record.paid_date ? formatDate(record.paid_date) : ''}</td>
                                                    <td>
                                                        
                                                        <button className={styles.exportBtn} style={{ padding: '0.35rem 0.6rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px' }} title="Edit Payment" onClick={() => handleEditFee(record)}>
                                                            <Edit size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>No payment records found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {filteredFeesRecords.length > 0 && !loading && (
                            <div className={styles.pagination}>
                                <div className={styles.paginationInfo}>
                                    Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredFeesRecords.length)} of {filteredFeesRecords.length} entries
                                </div>
                                <div className={styles.paginationControls}>
                                    <button 
                                        className={styles.pageBtn} 
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(number => number === 1 || number === totalPages || (number >= currentPage - 2 && number <= currentPage + 2))
                                        .map((number, index, array) => (
                                            <React.Fragment key={number}>
                                                {index > 0 && array[index - 1] !== number - 1 && <span style={{margin: '0 5px'}}>...</span>}
                                                <button
                                                    className={`${styles.pageBtn} ${currentPage === number ? styles.activePage : ''}`}
                                                    onClick={() => paginate(number)}
                                                >
                                                    {number}
                                                </button>
                                            </React.Fragment>
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
                    </>
                ) : (
                    // FORM VIEW
                    <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
                        <div className={styles.filters} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>College <span style={{color: 'red'}}>*</span></label>
                                <select 
                                    className={styles.selectInput} 
                                    value={formData.college} 
                                    onChange={handleCollegeChange}
                                    required
                                >
                                    <option value="">Select College</option>
                                    {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Department <span style={{color: 'red'}}>*</span></label>
                                <select 
                                    className={styles.selectInput} 
                                    value={`${formData.department}||${formData.programme}`}
                                    onChange={handleDepartmentChange}
                                    required
                                    disabled={!formData.college}
                                >
                                    <option value="||">Select Department</option>
                                    {departments.map(d => {
                                        const prog = d.program || '';
                                        const dept = d.department || '';
                                        const label = prog ? `${prog} - ${dept}` : dept;
                                        return <option key={`${dept}||${prog}`} value={`${dept}||${prog}`}>{label}</option>;
                                    })}
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Admission Year <span style={{color: 'red'}}>*</span></label>
                                <select 
                                    className={styles.selectInput} 
                                    value={formData.year_type} 
                                    onChange={handleYearChange}
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {years.map(y => <option key={y.id || y.admission_year_name} value={y.admission_year_name}>{y.admission_year_name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className={styles.filterGroup} style={{ position: 'relative' }}>
                                <label className={styles.filterLabel}>Student Name / App No <span style={{color: 'red'}}>*</span></label>
                                <input 
                                    type="text" 
                                    className={styles.searchInput} 
                                    placeholder="Type Name or App No..."
                                    value={studentSearchTerm}
                                    onChange={handleStudentSearchChange}
                                    required
                                    autoComplete="off"
                                />
                                {showSuggestions && studentsList.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.375rem',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 999,
                                        maxHeight: '200px', overflowY: 'auto', marginTop: '0.25rem'
                                    }}>
                                        {studentsList.map(student => {
                                            const dateStr = student.dob ? formatDate(student.dob) : 'N/A';
                                            return (
                                            <div
                                                key={student.id}
                                                onClick={() => handleSelectStudent(student)}
                                                style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <strong>{student.student_name}</strong> _ {student.application_no} _ {dateStr}
                                            </div>
                                        )})}
                                    </div>
                                )}
                                {showSuggestions && studentsList.length === 0 && studentSearchTerm && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem',
                                        zIndex: 999, marginTop: '0.25rem', color: '#64748b'
                                    }}>
                                        No students found matching your search.
                                    </div>
                                )}
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Refund? <span style={{color: 'red'}}>*</span></label>
                                <select 
                                    className={styles.selectInput} 
                                    value={formData.if_return || 'No'}
                                    onChange={(e) => {
                                        const isRefund = e.target.value;
                                        setFormData(prev => {
                                            const updated = { ...prev, if_return: isRefund };
                                            if (isRefund === 'No' && parseFloat(prev.paid_amount) < 0) {
                                                updated.paid_amount = '';
                                            }
                                            return updated;
                                        });
                                    }}
                                    required
                                >
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Payment Amount <span style={{color: 'red'}}>*</span></label>
                                <input 
                                    type="number" 
                                    className={styles.searchInput} 
                                    placeholder="Enter Amount"
                                    value={formData.paid_amount}
                                    onChange={(e) => setFormData(prev => ({...prev, paid_amount: e.target.value}))}
                                    required
                                    min={formData.if_return === 'Yes' ? undefined : '0'}
                                    step="0.01"
                                />
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Payment Mode <span style={{color: 'red'}}>*</span></label>
                                <select 
                                    className={styles.selectInput} 
                                    value={formData.payment_mode}
                                    onChange={(e) => setFormData(prev => ({...prev, payment_mode: e.target.value}))}
                                    required
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Payment Date <span style={{color: 'red'}}>*</span></label>
                                <input 
                                    type="date" 
                                    className={styles.searchInput} 
                                    value={formData.paid_date}
                                    onChange={(e) => setFormData(prev => ({...prev, paid_date: e.target.value}))}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <button 
                                type="submit" 
                                className={styles.exportBtn} 
                                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', fontSize: '1rem', cursor: 'pointer' }}
                            >
                                <Save size={18} style={{ marginRight: '8px' }} /> Save Fees Details
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default FeesEntry;
