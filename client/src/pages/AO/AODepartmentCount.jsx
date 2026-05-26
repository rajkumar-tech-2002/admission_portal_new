import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, BarChart3, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/ConsolidateReport.module.css'; // Borrowing consolidate report styles for filters
import dashStyles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const AODepartmentCount = () => {
    const [data, setData] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [masterData, setMasterData] = useState({
        colleges: [],
        departments: []
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [search, setSearch] = useState('');
    const [selectedColleges, setSelectedColleges] = useState([]);
    const [selectedDepartments, setSelectedDepartments] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch the new report data and the master data
                const [reportRes, masterRes] = await Promise.all([
                    apiService.get('/consolidate-report/department-count'),
                    apiService.get('/master')
                ]);

                if (reportRes.data.success) {
                    setData(reportRes.data.data);
                }

                if (masterRes.data.success) {
                    const md = masterRes.data.data;
                    const uniqueColleges = [...new Set(md.departments.map(d => d.institution).filter(Boolean))];
                    
                    setMasterData({
                        colleges: uniqueColleges,
                        departments: md.departments
                    });
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
                toast.error("Failed to load department count report");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const availableDepartments = useMemo(() => {
        let rows = data;
        if (selectedColleges.length > 0) {
            rows = rows.filter(r => selectedColleges.includes(r.college));
        }
        return [...new Set(rows.map(r => r.department).filter(Boolean))].sort();
    }, [selectedColleges, data]);

    useEffect(() => {
        let result = data;

        // Global Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(r => 
                (r.college || '').toLowerCase().includes(lowerSearch) ||
                (r.department || '').toLowerCase().includes(lowerSearch)
            );
        }

        // College Filter
        if (selectedColleges.length > 0) {
            result = result.filter(r => selectedColleges.includes((r.college || '').trim()));
        }

        // Department Filter
        if (selectedDepartments.length > 0) {
            result = result.filter(r => selectedDepartments.includes((r.department || '').trim()));
        }

        setFilteredRecords(result);
        setCurrentPage(1);
    }, [data, search, selectedColleges, selectedDepartments]);

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleResetFilters = () => {
        setSearch('');
        setSelectedColleges([]);
        setSelectedDepartments([]);
        setCurrentPage(1);
    };

    const handleExportRecords = () => {
        if (filteredRecords.length === 0) return toast.error("No records to export");
        
        const exportData = filteredRecords.map((r, i) => ({
            'S.No': i + 1,
            'College': r.college,
            'Department': r.department,
            'Staff Count': r.staff_count,
            'Target': r.admission_target_count,
            'Entry Count': r.total_admission_count,
            'Balance': r.balance_admission_count,
            'Percentage': r.admission_percentage
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Department_Count");
        XLSX.writeFile(wb, `Department_Count_${new Date().getTime()}.xlsx`);
    };

    const summary = useMemo(() => {
        return filteredRecords.reduce((acc, curr) => {
            acc.staffCount += Number(curr.staff_count) || 0;
            acc.target += Number(curr.admission_target_count) || 0;
            acc.entryCount += Number(curr.total_admission_count) || 0;
            acc.balance += Number(curr.balance_admission_count) || 0;
            return acc;
        }, { staffCount: 0, target: 0, entryCount: 0, balance: 0 });
    }, [filteredRecords]);

    const summaryPercentage = summary.target > 0 ? ((summary.entryCount / summary.target) * 100).toFixed(2) : '0.00';

    return (
        <div className={dashStyles.dashboard} style={{ padding: '0' }}>
            <div className={dashStyles.mainCard}>
                <div className={dashStyles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Department Count Report</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleExportRecords} className={dashStyles.exportBtn}>
                            <Download size={18} /> Export Excel
                        </button>
                    </div>
                </div>

                <div className={styles.filtersCard} style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <div className={styles.filtersRow} style={{ marginBottom: '1rem', justifyContent: 'space-between' }}>
                        <div className={`${styles.filterGroup} ${styles.searchGroup}`} style={{ flex: 1, maxWidth: '400px' }}>
                            <label className={styles.filterLabel}>Global Search</label>
                            <div className={styles.searchInputWrapper}>
                                <Search size={16} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Search college, department..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <button className={styles.resetBtn} onClick={handleResetFilters} style={{ alignSelf: 'flex-end' }}>
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Colleges Checkboxes */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Colleges</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {masterData.colleges.map(inst => (
                                    <label key={inst} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedColleges.includes(inst)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedColleges(prev => [...prev, inst]);
                                                else setSelectedColleges(prev => prev.filter(v => v !== inst));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {inst}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Departments Checkboxes */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Departments</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {availableDepartments.map(dept => (
                                    <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedDepartments.includes(dept)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedDepartments(prev => [...prev, dept]);
                                                else setSelectedDepartments(prev => prev.filter(v => v !== dept));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {dept}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={dashStyles.tableControls}>
                    <div className={dashStyles.limitSelector}>
                        <label>Show</label>
                        <select 
                            value={recordsPerPage} 
                            onChange={(e) => {
                                setRecordsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className={dashStyles.limitSelect}
                        >
                            <option value={100}>100</option>
                            <option value={150}>150</option>
                            <option value={200}>200</option>
                            <option value={250}>250</option>
                        </select>
                        <label>entries</label>
                    </div>
                </div>

                <div className={dashStyles.tableContainer}>
                    <table className={dashStyles.table}>
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>College</th>
                                <th>Department</th>
                                <th style={{ textAlign: 'center' }}>Staff Count</th>
                                <th style={{ textAlign: 'center' }}>Target</th>
                                <th style={{ textAlign: 'center' }}>Entry Count</th>
                                <th style={{ textAlign: 'center' }}>Balance</th>
                                <th style={{ textAlign: 'center' }}>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading report...</td>
                                </tr>
                            ) : currentRecords.length > 0 ? (
                                currentRecords.map((record, index) => (
                                    <tr key={index}>
                                        <td>{indexOfFirstRecord + index + 1}</td>
                                        <td>{record.college}</td>
                                        <td>{record.department}</td>
                                        <td style={{ textAlign: 'center' }}>{record.staff_count}</td>
                                        <td style={{ textAlign: 'center' }}>{record.admission_target_count}</td>
                                        <td style={{ textAlign: 'center' }}>{record.total_admission_count}</td>
                                        <td style={{ textAlign: 'center', color: Number(record.balance_admission_count) < 0 ? 'red' : 'inherit' }}>
                                            {record.balance_admission_count}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {Number(record.admission_percentage).toFixed(2)}%
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                     <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                </tr>
                            )}
                            {/* GRAND SUMMARY ROW */}
                            {!loading && filteredRecords.length > 0 && (
                                <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                                    <td colSpan="3" style={{ textAlign: 'right', paddingRight: '1rem', color: '#1e293b' }}>GRAND TOTAL</td>
                                    <td style={{ textAlign: 'center', color: '#0f172a' }}>{summary.staffCount}</td>
                                    <td style={{ textAlign: 'center', color: '#0f172a' }}>{summary.target}</td>
                                    <td style={{ textAlign: 'center', color: '#0f172a' }}>{summary.entryCount}</td>
                                    <td style={{ textAlign: 'center', color: '#0f172a' }}>{summary.balance}</td>
                                    <td style={{ textAlign: 'center', color: '#0f172a' }}>{summaryPercentage}%</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredRecords.length > 0 && !loading && (
                    <div className={dashStyles.pagination}>
                        <div className={dashStyles.paginationInfo}>
                            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} entries
                        </div>
                        <div className={dashStyles.paginationControls}>
                            <button 
                                className={dashStyles.pageBtn} 
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                <button
                                    key={number}
                                    className={`${dashStyles.pageBtn} ${currentPage === number ? dashStyles.activePage : ''}`}
                                    onClick={() => paginate(number)}
                                >
                                    {number}
                                </button>
                            ))}
                            <button 
                                className={dashStyles.pageBtn} 
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

export default AODepartmentCount;
