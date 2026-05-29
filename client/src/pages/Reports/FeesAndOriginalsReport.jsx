import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, FileText, IndianRupee } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const FeesAndOriginalsReport = () => {
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
                    apiService.get('/admissions/reports/fees-originals'),
                    apiService.get('/master')
                ]);

                if (admRes.data.success) {
                    setAdmissions(admRes.data.data);
                }

                if (masterRes.data.success) {
                    const md = masterRes.data.data;
                    
                    // Extract unique colleges
                    const uniqueColleges = [...new Set(md.departments.map(d => d.institution).filter(Boolean))];
                    
                    // Extract unique quotas from admissions
                    const admissionData = admRes.data?.data || [];
                    const uniqueQuotas = [...new Set(admissionData.map(a => a.quota).filter(Boolean))];
                    
                    setMasterData({
                        colleges: uniqueColleges,
                        departments: md.departments,
                        years: md.admissionYears,
                        quotas: uniqueQuotas
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

    const handleExportRecords = () => {
        if (filteredRecords.length === 0) return toast.error("No records to export");
        
        // Define columns to export for the report
        const exportData = filteredRecords.map((r, i) => ({
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
            'Student Mobile No': r.student_mobile_no,
            'Reference Type': r.reference_type,
            'Reference College': r.reference_college,
            'Reference Department': r.reference_department,
            'Reference By Name': r.reference_by_name,
            'Reference By Mobile': r.reference_by_mobile,
            '10th Marksheet': r.tenth_marksheet,
            '10th Temp': r.tenth_temp,
            '11th Marksheet': r.eleventh_marksheet,
            '12th Marksheet': r.twelfth_marksheet,
            '12th Temp': r.twelfth_temp,
            'Transfer Certificate': r.transfer_certificate,
            'Community Certificate': r.community_certificate,
            'First Graduate Certificate': r.first_graduate_certificate,
            'Income Certificate': r.income_certificate,
            'Native Certificate': r.native_certificate,
            'Bonafide Certificate': r.bonafide_certificate,
            'JD Certificate': r.JD_certificate,
            'Remarks': r.remarks
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fees_And_Originals_Report");
        XLSX.writeFile(wb, `Fees_And_Originals_Report_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <IndianRupee size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Fees & Originals Report</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                            {masterData.years.map((y) => (
                                <option key={y.id} value={y.admission_year_name}>{y.admission_year_name}</option>
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
                            {masterData.departments
                                .filter(d => college ? d.institution === college : true)
                                .map(d => {
                                    const label = d.program ? `${d.program} - ${d.department}` : d.department;
                                    return <option key={d.id} value={d.department}>{label}</option>;
                                })}
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
                            <option value="ADMITTED">Admitted</option>
                            <option value="DISCONTINUE">Discontinue</option>
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
                                <th>Father Mobile No</th>
                                <th>Student Mobile No</th>
                                <th>Ref Type</th>
                                <th>Ref College</th>
                                <th>Ref Dept</th>
                                <th>Ref By Name</th>
                                <th>Ref By Mobile</th>
                                <th>10th Marksheet</th>
                                <th>10th Temp</th>
                                <th>11th Marksheet</th>
                                <th>12th Marksheet</th>
                                <th>12th Temp</th>
                                <th>TC</th>
                                <th>Community Cert</th>
                                <th>First Grad Cert</th>
                                <th>Income Cert</th>
                                <th>Native Cert</th>
                                <th>Bonafide Cert</th>
                                <th>JD Cert</th>
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
                                        <td>{record.father_mobile_no}</td>
                                        <td>{record.student_mobile_no}</td>
                                        <td>{record.reference_type}</td>
                                        <td>{record.reference_college}</td>
                                        <td>{record.reference_department}</td>
                                        <td>{record.reference_by_name}</td>
                                        <td>{record.reference_by_mobile}</td>
                                        <td>{record.tenth_marksheet}</td>
                                        <td>{record.tenth_temp}</td>
                                        <td>{record.eleventh_marksheet}</td>
                                        <td>{record.twelfth_marksheet}</td>
                                        <td>{record.twelfth_temp}</td>
                                        <td>{record.transfer_certificate}</td>
                                        <td>{record.community_certificate}</td>
                                        <td>{record.first_graduate_certificate}</td>
                                        <td>{record.income_certificate}</td>
                                        <td>{record.native_certificate}</td>
                                        <td>{record.bonafide_certificate}</td>
                                        <td>{record.JD_certificate}</td>
                                        <td>{record.remarks}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                     <td colSpan="32" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
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

export default FeesAndOriginalsReport;
