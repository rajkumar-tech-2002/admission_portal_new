import React, { useState, useEffect } from 'react';
import { Search, Mail, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import apiService from '../../../services/api.service';
import styles from '../../../components/css/Dashboard.module.css';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../../utils/dateFormatter';

const EmailLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    
    // Search
    const [search, setSearch] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const response = await apiService.get(`/master/email-logs/all?${params.toString()}`);
            if (response.data.success) {
                setLogs(response.data.data);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Error fetching email logs:', error);
            toast.error('Failed to load email logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [search]);

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentLogs = logs.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(logs.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleResetFilters = () => {
        setSearch('');
        setCurrentPage(1);
    };

    return (
        <div className={styles.dashboard}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={24} color="var(--primary-color)" />
                        <h2 style={{color:"var(--primary-color)"}}>Email Delivery Logs</h2>
                    </div>
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterGroup} style={{ flex: 1 }}>
                        <label className={styles.filterLabel}>Search Logs</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                className={styles.searchInput} 
                                placeholder="Search Reg ID, Email, Status..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: '100%' }}
                            />
                            <Search size={16} style={{ position: 'absolute', right: 10, top: 10, color: '#9ca3af' }}/>
                        </div>
                    </div>
                    <div className={styles.filterGroup} style={{ alignSelf: 'flex-end' }}>
                        <button onClick={handleResetFilters} className={styles.resetFiltersBtn}>
                            Reset
                        </button>
                    </div>
                </div>

                <div className={styles.tableControls} style={{ marginTop: '1.5rem' }}>
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
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <label>entries</label>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading logs...</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Reg ID</th>
                                    <th>Recipient Email</th>
                                    <th>Status</th>
                                    <th>Sent At</th>
                                    <th>Error Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLogs.length > 0 ? (
                                    currentLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td>{log.id}</td>
                                            <td><strong>{log.reg_id}</strong></td>
                                            <td>{log.recipient_email}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles['email-' + log.status]}`}>
                                                    {log.status === 'Sent' ? <CheckCircle size={12} style={{marginRight: 4}}/> : <AlertCircle size={12} style={{marginRight: 4}}/>}
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} />
                                                    {formatDateTime(log.sent_at)}
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: '250px', fontSize: '0.75rem', color: '#6b7280' }}>
                                                {log.error_message || <span style={{color: '#9ca3af'}}>—</span>}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No email logs found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && logs.length > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, logs.length)} of {logs.length} entries
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

export default EmailLogs;
