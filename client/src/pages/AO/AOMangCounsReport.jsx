import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, BarChart3, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/ConsolidateReport.module.css';
import dashStyles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const AOMangCounsReport = () => {
    const [data, setData] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [masterData, setMasterData] = useState({
        colleges: [],
        quotas: []
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [search, setSearch] = useState('');
    const [selectedColleges, setSelectedColleges] = useState([]);
    const [selectedQuotas, setSelectedQuotas] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await apiService.get('/consolidate-report/mang-couns');

                if (response.data.success) {
                    const reportData = response.data.data || [];
                    setData(reportData);

                    const uniqueColleges = [...new Set(reportData.map(r => r.college).filter(Boolean))].sort();
                    const uniqueQuotas = [...new Set(reportData.map(r => r.quota).filter(Boolean))].sort();
                    
                    setMasterData({
                        colleges: uniqueColleges,
                        quotas: uniqueQuotas
                    });
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
                toast.error("Failed to load Management/Counselling report");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const availableQuotas = useMemo(() => {
        let rows = data;
        if (selectedColleges.length > 0) {
            rows = rows.filter(r => selectedColleges.includes(r.college));
        }
        return [...new Set(rows.map(r => r.quota).filter(Boolean))].sort();
    }, [selectedColleges, data]);

    useEffect(() => {
        let result = data;

        // Global Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(r => 
                (r.college || '').toLowerCase().includes(lowerSearch) ||
                (r.quota || '').toLowerCase().includes(lowerSearch)
            );
        }

        // College Filter
        if (selectedColleges.length > 0) {
            result = result.filter(r => selectedColleges.includes((r.college || '').trim()));
        }

        // Quota Filter
        if (selectedQuotas.length > 0) {
            result = result.filter(r => selectedQuotas.includes((r.quota || '').trim()));
        }

        setFilteredRecords(result);
        setCurrentPage(1);
    }, [data, search, selectedColleges, selectedQuotas]);

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleResetFilters = () => {
        setSearch('');
        setSelectedColleges([]);
        setSelectedQuotas([]);
        setCurrentPage(1);
    };

    const handleExportRecords = () => {
        if (filteredRecords.length === 0) return toast.error("No records to export");
        
        const exportData = filteredRecords.map((r, i) => ({
            'S.No': i + 1,
            'College': r.college,
            'Quota': r.quota,
            'Admitted Count': r.admitted_count,
            'Discontinue Count': r.discontinue_count,
            'Total Count': r.total_count
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Mang_Couns_Report");
        XLSX.writeFile(wb, `Management_Counselling_Report_${new Date().getTime()}.xlsx`);
    };

    const summary = useMemo(() => {
        return filteredRecords.reduce((acc, curr) => {
            acc.admittedCount += Number(curr.admitted_count) || 0;
            acc.discontinueCount += Number(curr.discontinue_count) || 0;
            acc.totalCount += Number(curr.total_count) || 0;
            return acc;
        }, { admittedCount: 0, discontinueCount: 0, totalCount: 0 });
    }, [filteredRecords]);

    return (
        <div className={dashStyles.dashboard} style={{ padding: '0' }}>
            <div className={dashStyles.mainCard}>
                <div className={dashStyles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Management/Counselling Report</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                                    placeholder="Search college, quota..."
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

                        {/* Quotas Checkboxes */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Quotas</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {availableQuotas.map(quota => (
                                    <label key={quota} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedQuotas.includes(quota)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedQuotas(prev => [...prev, quota]);
                                                else setSelectedQuotas(prev => prev.filter(v => v !== quota));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {quota}
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
                                <th>Quota</th>
                                <th style={{ textAlign: 'center' }}>Admitted Count</th>
                                <th style={{ textAlign: 'center' }}>Discontinue Count</th>
                                <th style={{ textAlign: 'center' }}>Total Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading report...</td>
                                </tr>
                            ) : currentRecords.length > 0 ? (
                                currentRecords.map((record, index) => (
                                    <tr key={index}>
                                        <td>{indexOfFirstRecord + index + 1}</td>
                                        <td>{record.college}</td>
                                        <td>{record.quota}</td>
                                        <td style={{ textAlign: 'center' }}>{record.admitted_count}</td>
                                        <td style={{ textAlign: 'center' }}>{record.discontinue_count}</td>
                                        <td style={{ textAlign: 'center' }}>{record.total_count}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                     <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                </tr>
                            )}
                            {/* GRAND SUMMARY ROW */}
                            {!loading && filteredRecords.length > 0 && (
                                <tr className={dashStyles.subtotalRow}>
                                    <td colSpan="3" className={dashStyles.subtotalLabel} style={{ textAlign: 'right', paddingRight: '1rem' }}>GRAND TOTAL</td>
                                    <td className={dashStyles.subtotalVal}>SUM={summary.admittedCount}</td>
                                    <td className={dashStyles.subtotalVal}>SUM={summary.discontinueCount}</td>
                                    <td className={dashStyles.subtotalVal}>SUM={summary.totalCount}</td>
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

export default AOMangCounsReport;
