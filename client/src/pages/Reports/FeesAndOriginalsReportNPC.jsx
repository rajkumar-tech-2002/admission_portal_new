import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, IndianRupee } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const FeesAndOriginalsReportNPC = () => {
    const [admissions, setAdmissions] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [masterData, setMasterData] = useState({
        colleges: [],
        departments: [],
        years: [],
        quotas: [],
        statuses: []
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
                const res = await apiService.get('/admissions/reports/fees-originals-npc');

                if (res.data.success) {
                    setAdmissions(res.data.data);

                    const admissionData = res.data?.data || [];
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
                }
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

    const hideIYearCols = year === 'I Year';
    const hideIIYearLECols = year === 'II Year - LE';

    const getColumnsConfig = () => {
        let cols = [
            { key: 'ms_10', label: '10th MS' }
        ];

        if (year === 'I Year') {
            cols.push({ key: 'temp_10', label: '10th Temp' });
        }

        if (!hideIYearCols) {
            cols.push(
                { key: 'ms_11', label: '11th MS' },
                { key: 'ms_12', label: '12th MS' },
                { key: 'temp_12', label: '12th Temp' }
            );
        }

        cols.push(
            { key: 'tc', label: 'TC' },
            { key: 'community_cert', label: 'Community Cert' },
            { key: 'photo_2_copy', label: 'Photo (2 Copy)' },
            { key: 'aadhaar', label: 'Aadhaar' }
        );

        if (!hideIIYearLECols) {
            cols.push({ key: 'equivalency_cert', label: 'Equivalency Cert' });
        }

        if (!hideIYearCols) {
            cols.push({ key: 'migration_cert', label: 'Migration Cert' });
        }

        cols.push(
            { key: 'ms_iti', label: 'ITI MS' },
            { key: 'iti_prov', label: 'ITI Prov' },
            { key: 'iti_cert_add', label: 'ITI Cert Add' }
        );

        return cols;
    };

    const columns = getColumnsConfig();

    const handleExportRecords = () => {
        if (filteredRecords.length === 0) return toast.error("No records to export");
        
        const exportData = filteredRecords.map((r, i) => {
            let row = {
                'S.No': i + 1,
                'Application Number': r.application_no,
                'Student Name': r.student_name,
                'College': r.college,
                'Admission Date': r.admission_date ? r.admission_date.substring(0, 10).split('-').reverse().join('-') : '',
                'Department': r.department,
                'Admission Year': r.admission_year,
                'Quota': r.quota,
                'Student Status': r.student_status,
                'Total Fee': r.total_fee,
                'Total Paid': r.total_paid,
                'Balance Amount': r.balance_amount,
                'Father Mobile No': r.father_mobile_no,
                'Mother Mobile No': r.mother_mobile_no,
                'Student Mobile No': r.student_mobile_no,
                'Community': r.community,
                'Reference Type': r.reference_type,
                'Consultancy Name': r.consultancy_name,
                'Consultancy Person Name': r.consultancy_person_name,
                'Consultancy Mobile': r.consultancy_mobile,
                'Reference College': r.reference_college,
                'Reference Department': r.reference_department,
                'Reference By Name': r.reference_by_name,
                'Reference By Mobile': r.reference_by_mobile,
            };

            columns.forEach(col => {
                row[col.label] = r[col.key];
            });

            row['Remarks'] = r.remarks;
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fees_And_Originals_Report_NPC");
        XLSX.writeFile(wb, `Fees_And_Originals_Report_NPC_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <IndianRupee size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Fees & Originals Report (NPC)</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={handleExportRecords} className={styles.exportBtn}>
                            <Download size={18} /> Export Excel
                        </button>
                    </div>
                </div>

                <div className={styles.filters} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Year <span style={{color:'red'}}>*</span></label>
                        <select 
                            className={styles.selectInput}
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            <option value="">Select Year to View Report</option>
                            {masterData.years.map((y, index) => (
                                <option key={index} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

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

                {!year ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }}>
                        Please select an Admission Year to view the report.
                    </div>
                ) : (
                    <>
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

                        <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
                            <table className={styles.table} style={{ whiteSpace: 'nowrap' }}>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Application Number</th>
                                        <th>Student Name</th>
                                        <th>College</th>
                                        <th>Admission Date</th>
                                        <th>Department</th>
                                        <th>Admission Year</th>
                                        <th>Quota</th>
                                        <th>Admission Status</th>
                                        <th>Total Fee</th>
                                        <th>Total Paid</th>
                                        <th>Balance Amount</th>
                                        <th>Community</th>
                                        <th>Father Mobile No</th>
                                        <th>Mother Mobile No</th>
                                        <th>Student Mobile No</th>
                                        <th>Ref Type</th>
                                        <th>Consultancy Name</th>
                                        <th>Consultancy Person Name</th>
                                        <th>Consultancy Mobile</th>
                                        <th>Ref College</th>
                                        <th>Ref Dept</th>
                                        <th>Ref By Name</th>
                                        <th>Ref By Mobile</th>
                                        {columns.map(col => (
                                            <th key={col.key}>{col.label}</th>
                                        ))}
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRecords.length > 0 ? (
                                        currentRecords.map((record, index) => (
                                            <tr key={index}>
                                                <td>{indexOfFirstRecord + index + 1}</td>
                                                <td><strong>{record.application_no}</strong></td>
                                                <td>{record.student_name}</td>
                                                <td>{record.college}</td>
                                                <td>{record.admission_date ? record.admission_date.substring(0, 10).split('-').reverse().join('-') : ''}</td>
                                                <td>{record.department}</td>
                                                <td>{record.admission_year}</td>
                                                <td>{record.quota}</td>
                                                <td style={{ color: (record.student_status || '').toUpperCase() === 'ADMITTED' ? 'green' : 'red', fontWeight: '500' }}>{record.student_status}</td>
                                                <td>{record.total_fee}</td>
                                                <td>{record.total_paid}</td>
                                                <td style={{ color: record.balance_amount > 0 ? 'red' : 'green' }}>{record.balance_amount}</td>
                                                <td>{record.community}</td>
                                                <td>{record.father_mobile_no}</td>
                                                <td>{record.mother_mobile_no}</td>
                                                <td>{record.student_mobile_no}</td>
                                                <td>{record.reference_type}</td>
                                                <td>{record.consultancy_name}</td>
                                                <td>{record.consultancy_person_name}</td>
                                                <td>{record.consultancy_mobile}</td>
                                                <td>{record.reference_college}</td>
                                                <td>{record.reference_department}</td>
                                                <td>{record.reference_by_name}</td>
                                                <td>{record.reference_by_mobile}</td>
                                                
                                                {columns.map(col => (
                                                    <td key={col.key}>{record[col.key]}</td>
                                                ))}

                                                <td>{record.remarks}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={20 + columns.length} style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default FeesAndOriginalsReportNPC;
