import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Download, Search, ArchiveRestore, FileText, Mail } from 'lucide-react';
import apiService from '../../services/api.service';
import styles from '../../components/css/Dashboard.module.css';
import reportStyles from '../../components/css/RecordReport.module.css';
import RecordReport from '../../components/layout/RecordReport';
import toast from 'react-hot-toast';
import { formatDate, formatDateTime } from '../../utils/dateFormatter';

const ArchivedList = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [captureData, setCaptureData] = useState(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);
    
    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (status) params.append('status', status);
            if (fromDate) params.append('fromDate', fromDate);
            if (toDate) params.append('toDate', toDate);
            params.append('isArchived', 'true');

            const response = await apiService.get(`/records?${params.toString()}`);
            if (response.data.success) {
                setRecords(response.data.data);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Error fetching archived records:', error);
            toast.error('Failed to load archived records');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async (id) => {
        const record = records.find(r => r.id === id);
        if (!record) return toast.error('Record data not found');

        const loadingToast = toast.loading('Generating PDF and sending email...');
        try {
            // 1. Setup capture data
            setCaptureData(record);
            setIsGenerating(true);

            // 2. Wait for hidden render
            await new Promise(resolve => setTimeout(resolve, 800));

            // 3. Capture PDF
            const element = document.getElementById('resend-archive-capture-area');
            const opt = {
                margin: 0,
                filename: `Enquiry_Report_${record.reg_id}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const html2pdf = (await import('html2pdf.js')).default;
            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

            // 4. Prepare FormData
            const payload = new FormData();
            payload.append('pdf', pdfBlob, `Enquiry_Report_${record.reg_id}.pdf`);

            // 5. Send to API
            const apiBase = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
            const response = await axios.post(`${apiBase}/records/${id}/send-email`, payload, {
                headers: { 
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                toast.success('Email sent successfully with PDF!', { id: loadingToast });
                fetchRecords();
            } else {
                toast.error(response.data.message || 'Failed to send email', { id: loadingToast });
            }
        } catch (error) {
            console.error('Error sending email:', error);
            toast.error(error.response?.data?.message || 'Failed to send email', { id: loadingToast });
        } finally {
            setIsGenerating(false);
            setCaptureData(null);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [search, status, fromDate, toDate]);

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(records.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleResetFilters = () => {
        setSearch('');
        setStatus('');
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
    };

    const handleExport = () => {
        if (records.length === 0) return toast.error('No records to export');
        
        const exportData = records.map((r, index) => ({
            'S.No': index + 1,
            'Reg ID': r.reg_id,
            'Name': r.std_name,
            'Mobile': r.std_mobile_no,
            'City': r.city,
            'Community': r.community,
            'Dept': r.selected_dept,
            'Course': r.selected_course,
            'Status': r.admission_status,
            'Date': formatDate(r.admission_date_time)
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Archived_Admissions");
        XLSX.writeFile(wb, `Archived_Records_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className={styles.dashboard}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArchiveRestore size={24} color="var(--primary-color)" />
                        <h2 style={{color:"var(--primary-color)"}}>Archived Records</h2>
                    </div>
                    <button onClick={handleExport} className={styles.exportBtn}>
                        <Download size={18} /> Export Excel
                    </button>
                </div>

                <div className={styles.filters}>
                    {/* ... (filter groups) ... */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Global Search</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                className={styles.searchInput} 
                                placeholder="Search name, id, regno, aadhaar, email, mobile..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search size={16} style={{ position: 'absolute', right: 10, top: 10, color: '#9ca3af' }}/>
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status</label>
                        <select 
                            className={styles.selectInput}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Enquiry">Enquiry</option>
                            <option value="Admitted">Admitted</option>
                            <option value="Discontinue">Discontinue</option>
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

                <div className={styles.resetRow}>
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
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading archived records...</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Reg_ID</th>
                                    <th>Date & Time</th>
                                    <th>Name</th>
                                    <th>RegNo</th>
                                    <th>Mobile</th>
                                    <th>UG/PG</th>
                                    <th>Dept</th>
                                    <th>Course</th>
                                    <th>Aadhaar</th>
                                    <th>Refer Email</th>
                                    <th>Email Status</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRecords.length > 0 ? (
                                    currentRecords.map((record, index) => (
                                        <tr key={record.id}>
                                            <td>{indexOfFirstRecord + index + 1}</td>
                                            <td><strong>{record.reg_id}</strong></td>
                                            <td>{formatDateTime(record.admission_date_time)}</td>
                                            <td>{record.std_name}</td>
                                            <td>{record.reg_no_12th}</td>
                                            <td>{record.std_mobile_no}</td>
                                            <td>{record.selected_ug_pg}</td>
                                            <td>{record.selected_dept}</td>
                                            <td>{record.selected_course}</td>
                                            <td>{record.aadhaar_no}</td>
                                            <td>{record.reference_email}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles['email-' + (record.email_status || 'Pending')]}`}>
                                                    {record.email_status || 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles['status-' + record.admission_status]}`}>
                                                    {record.admission_status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button 
                                                        className={styles.viewBtn}
                                                        onClick={() => {
                                                            window.open(`/report-print/${record.id}`, '_blank');
                                                        }}
                                                        title="View PDF"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button 
                                                        className={styles.mailBtn}
                                                        onClick={() => handleSendEmail(record.id)}
                                                        title="Send/Resend Email"
                                                    >
                                                        <Mail size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="12" style={{ textAlign: 'center', padding: '2rem' }}>No archived records found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && records.length > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, records.length)} of {records.length} entries
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
            
            {/* Hidden capture area for resending email with PDF */}
            {isGenerating && captureData && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, width: '210mm' }}>
                    <div id="resend-archive-capture-area" style={{ background: '#fff' }}>
                        <RecordReport 
                            data={captureData} 
                            standalone={true} 
                        />
                    </div>
                </div>
            )}
        </div>

    );
};

export default ArchivedList;
