import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const ToOfficeReport = () => {
    const [admissions, setAdmissions] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [masterData, setMasterData] = useState({
        colleges: [],
        departments: [],
        years: [],
        quotas: []
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);
    
    // Filters
    const [search, setSearch] = useState('');
    const [college, setCollege] = useState('');
    const [year, setYear] = useState('');
    const [course, setCourse] = useState(''); // Department
    const [quota, setQuota] = useState('');
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [admRes, masterRes] = await Promise.all([
                    apiService.get('/admissions/list'),
                    apiService.get('/master')
                ]);

                if (admRes.data.success) {
                    setAdmissions(admRes.data.data);
                }

                    const admissionData = admRes.data?.data || [];
                    const uniqueColleges = [...new Set(admissionData.map(a => a.college).filter(Boolean))].sort();
                    const uniqueYears = [...new Set(admissionData.map(a => a.admission_year).filter(Boolean))].sort();
                    const uniqueCourses = [...new Set(admissionData.map(a => a.department).filter(Boolean))].sort();
                    const uniqueQuotas = [...new Set(admissionData.map(a => a.quota).filter(Boolean))].sort();
                    const uniqueStatuses = [...new Set(admissionData.map(a => a.student_status).filter(Boolean))].sort();
                    
                    setMasterData({
                        colleges: uniqueColleges,
                        departments: uniqueCourses,
                        years: uniqueYears,
                        quotas: uniqueQuotas,
                        statuses: uniqueStatuses
                    });
            } catch (err) {
                console.error("Failed to fetch data:", err);
                toast.error("Failed to load report data");
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let result = admissions;

        // Global Search
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

        // College Filter
        if (college) {
            result = result.filter(r => (r.college || '').trim() === college);
        }

        // Year Filter
        if (year) {
            result = result.filter(r => (r.admission_year || '') === year);
        }

        // Course/Department Filter
        if (course) {
            result = result.filter(r => (r.department || '') === course);
        }

        // Quota Filter
        if (quota) {
            result = result.filter(r => (r.quota || '') === quota);
        }

        // Status Filter
        if (status) {
            result = result.filter(r => (r.student_status || '').toUpperCase() === status.toUpperCase());
        }

        // Date Filters
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
    }, [admissions, search, college, year, course, quota, status, fromDate, toDate]);

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleResetFilters = () => {
        setSearch('');
        setCollege('');
        setYear('');
        setCourse('');
        setQuota('');
        setStatus('');
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
    };

    const handleExportRecords = () => {
        if (filteredRecords.length === 0) return toast.error("No records to export");
        
        // Define columns to export for the report
        const exportData = filteredRecords.map((r, i) => ({
            'S.No': i + 1,
            'Application Number': r.application_no,
            'College': r.college,
            'Department': r.programme ? `${r.programme} - ${r.department}` : r.department,
            'Quota': r.quota,
            'Year': r.admission_year,
            'Admission Date': r.admission_date ? r.admission_date.substring(0, 10).split('-').reverse().join('-') : '',
            'Admission Status': r.student_status,
            'Student Name': r.student_name,
            'Community': r.community,
            'DOB': r.dob ? r.dob.substring(0, 10).split('-').reverse().join('-') : '',
            'Original Certificate': '',
            'OS Sign': ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "To_Office_Report");
        XLSX.writeFile(wb, `To_Office_Report_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>To Office Report</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={handleExportRecords} className={styles.exportBtn}>
                            <Download size={18} /> Export Excel
                        </button>
                    </div>
                </div>

                <div className={styles.filters} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Global Search</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                className={styles.searchInput} 
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search size={16} style={{ position: 'absolute', right: 10, top: 10, color: '#9ca3af' }}/>
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>College</label>
                        <select 
                            className={styles.selectInput}
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                        >
                            <option value="">All Colleges</option>
                            {masterData.colleges.map((c, i) => (
                                <option key={i} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Year</label>
                        <select 
                            className={styles.selectInput}
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            <option value="">All Years</option>
                            {masterData.years.map((y, index) => (
                                <option key={index} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Course (Department)</label>
                        <select 
                            className={styles.selectInput}
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                        >
                            <option value="">All Courses</option>
                            {masterData.departments.map((d, index) => (
                                <option key={index} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Quota</label>
                        <select 
                            className={styles.selectInput}
                            value={quota}
                            onChange={(e) => setQuota(e.target.value)}
                        >
                            <option value="">All Quotas</option>
                            {masterData.quotas.map((q, index) => (
                                <option key={index} value={q}>{q}</option>
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
                            <option value="">All Status</option>
                            {masterData.statuses?.map((s, index) => (
                                <option key={index} value={s}>{s}</option>
                            ))}
                        </select>
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
                                <th>S.No</th>
                                <th>Application Number</th>
                                <th>College</th>
                                <th>Department</th>
                                <th>Quota</th>
                                <th>Year</th>
                                <th>Admission Date</th>
                                <th>Admission Status</th>
                                <th>Student Name</th>
                                <th>Community</th>
                                <th>DOB</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRecords.length > 0 ? (
                                currentRecords.map((record, index) => (
                                    <tr key={record.id}>
                                        <td>{indexOfFirstRecord + index + 1}</td>
                                        <td><strong>{record.application_no}</strong></td>
                                        <td>{record.college}</td>
                                        <td>{record.programme ? `${record.programme} - ${record.department}` : record.department}</td>
                                        <td>{record.quota}</td>
                                        <td>{record.admission_year}</td>
                                        <td>{record.admission_date ? record.admission_date.substring(0, 10).split('-').reverse().join('-') : ''}</td>
                                        <td style={{ color: (record.student_status || '').toUpperCase() === 'ADMITTED' ? 'green' : 'red', fontWeight: '500' }}>{record.student_status}</td>
                                        <td>{record.student_name}</td>
                                        <td>{record.community}</td>
                                        <td>{record.dob ? record.dob.substring(0, 10).split('-').reverse().join('-') : ''}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                     <td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
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

export default ToOfficeReport;
