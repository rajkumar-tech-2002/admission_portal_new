import React, { useState, useEffect } from 'react';
import { Search, Download, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const CertificateCountReportNPC = () => {
    const [admissions, setAdmissions] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [groupedRows, setGroupedRows] = useState([]);
    
    const [masterData, setMasterData] = useState({
        colleges: [],
        departments: [],
        years: [],
        quotas: []
    });

    // Filters
    const [college, setCollege] = useState('');
    const [year, setYear] = useState('');
    const [course, setCourse] = useState(''); // Department
    const [quota, setQuota] = useState('');
    const [status, setStatus] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiService.get(`/admissions/reports/certificate-count-npc?status=${status}`);

                if (res.data.success) {
                    setAdmissions(res.data.data);

                    const admissionData = res.data?.data || [];
                    const uniqueColleges = [...new Set(admissionData.map(a => a.college).filter(Boolean))].sort();
                    const uniqueYears = [...new Set(admissionData.map(a => a.admission_year).filter(Boolean))].sort();
                    const uniqueCourses = [...new Set(admissionData.map(a => a.department).filter(Boolean))].sort();
                    const uniqueQuotas = [...new Set(admissionData.map(a => a.quota).filter(Boolean))].sort();
                    
                    setMasterData({
                        colleges: uniqueColleges,
                        departments: uniqueCourses,
                        years: uniqueYears,
                        quotas: uniqueQuotas
                    });
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
                toast.error("Failed to load report data");
            }
        };
        fetchData();
    }, [status]);

    useEffect(() => {
        let result = admissions;

        if (college) result = result.filter(r => (r.college || '').trim() === college);
        if (year) result = result.filter(r => (r.admission_year || '') === year);
        if (course) result = result.filter(r => (r.department || '') === course);
        if (quota) result = result.filter(r => (r.quota || '') === quota);

        setFilteredRecords(result);
    }, [admissions, college, year, course, quota]);

    useEffect(() => {
        // Process grouping
        const data = filteredRecords;
        let rows = [];
        
        const collegesList = [...new Set(data.map(d => d.college))].sort();
        
        let grandTotals = {
            total_students: 0,
            ms_10_count: 0,
            temp_10_count: 0,
            ms_11_count: 0,
            ms_12_count: 0,
            temp_12_count: 0,
            tc_count: 0,
            community_cert_count: 0,
            photo_2_copy_count: 0,
            aadhaar_count: 0,
            equivalency_cert_count: 0,
            migration_cert_count: 0,
            ms_iti_count: 0,
            iti_prov_count: 0,
            iti_cert_add_count: 0
        };

        collegesList.forEach(col => {
            const colData = data.filter(d => d.college === col);
            const yearsList = [...new Set(colData.map(d => d.admission_year))].sort();
            
            yearsList.forEach((yr, yrIndex) => {
                const yrData = colData.filter(d => d.admission_year === yr);
                const quotasList = [...new Set(yrData.map(d => d.quota))].sort();
                
                let yrTotals = { ...grandTotals };
                for(let k in yrTotals) yrTotals[k] = 0;

                quotasList.forEach((q, qIndex) => {
                    const qData = yrData.filter(d => d.quota === q);
                    qData.sort((a, b) => (a.department || '').localeCompare(b.department || ''));
                    
                    let qTotals = { ...grandTotals };
                    for(let k in qTotals) qTotals[k] = 0;
                    
                    qData.forEach((row, rIndex) => {
                        for(let k in qTotals) {
                            qTotals[k] += (Number(row[k]) || 0);
                            yrTotals[k] += (Number(row[k]) || 0);
                            grandTotals[k] += (Number(row[k]) || 0);
                        }
                        
                        rows.push({
                            type: 'data',
                            displayCollege: (yrIndex === 0 && qIndex === 0 && rIndex === 0) ? col : '',
                            displayYear: (qIndex === 0 && rIndex === 0) ? yr : '',
                            displayQuota: (rIndex === 0) ? q : '',
                            department: row.department,
                            ...row
                        });
                    });
                    
                    rows.push({
                        type: 'quota_total',
                        label: `${q || 'Unknown'} Total`,
                        ...qTotals
                    });
                });
                
                rows.push({
                    type: 'year_total',
                    label: `${yr || 'Unknown'} Total`,
                    ...yrTotals
                });
            });
        });
        
        if (data.length > 0) {
            rows.push({
                type: 'grand_total',
                label: 'Grand Summary',
                ...grandTotals
            });
        }
        
        setGroupedRows(rows);
    }, [filteredRecords]);

    const handleResetFilters = () => {
        setCollege('');
        setYear('');
        setCourse('');
        setQuota('');
        setStatus('All');
    };

    // Derived visibility based on year
    const hideIYearCols = year === 'I Year';
    const hideIIYearLECols = year === 'II Year - LE';

    const getColumnsConfig = () => {
        let cols = [
            { key: 'total_students', label: 'Total Students' },
            { key: 'ms_10_count', label: '10th MS' }
        ];

        if (year === 'I Year') {
            cols.push({ key: 'temp_10_count', label: '10th Temp' });
        }

        if (!hideIYearCols) {
            cols.push(
                { key: 'ms_11_count', label: '11th MS' },
                { key: 'ms_12_count', label: '12th MS' },
                { key: 'temp_12_count', label: '12th Temp' }
            );
        }

        cols.push(
            { key: 'tc_count', label: 'TC' },
            { key: 'community_cert_count', label: 'Community Cert' },
            { key: 'photo_2_copy_count', label: 'Photo (2 Copy)' },
            { key: 'aadhaar_count', label: 'Aadhaar' }
        );

        if (!hideIIYearLECols) {
            cols.push({ key: 'equivalency_cert_count', label: 'Equivalency Cert' });
        }

        if (!hideIYearCols) {
            cols.push({ key: 'migration_cert_count', label: 'Migration Cert' });
        }

        cols.push(
            { key: 'ms_iti_count', label: 'ITI MS' },
            { key: 'iti_prov_count', label: 'ITI Prov' },
            { key: 'iti_cert_add_count', label: 'ITI Cert Add' }
        );

        return cols;
    };

    const columns = getColumnsConfig();

    const handleExportRecords = () => {
        if (groupedRows.length === 0) return toast.error("No records to export");
        
        const exportData = groupedRows.map(r => {
            let rowData = {
                'College': '',
                'Year': '',
                'Quota': '',
                'Department': ''
            };

            if (r.type === 'data') {
                rowData['College'] = r.displayCollege;
                rowData['Year'] = r.displayYear;
                rowData['Quota'] = r.displayQuota;
                rowData['Department'] = r.department;
            } else if (r.type === 'quota_total') {
                rowData['Quota'] = r.label;
            } else if (r.type === 'year_total') {
                rowData['Year'] = r.label;
            } else if (r.type === 'grand_total') {
                rowData['College'] = r.label;
            }

            columns.forEach(col => {
                rowData[col.label] = r[col.key] || 0;
            });

            return rowData;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Certificate_Count_NPC");
        XLSX.writeFile(wb, `Certificate_Count_NPC_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Certificate Count Report (NPC)</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={handleExportRecords} className={styles.exportBtn}>
                            <Download size={18} /> Export Excel
                        </button>
                    </div>
                </div>

                <div className={styles.filters} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status</label>
                        <select 
                            className={styles.selectInput}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="All">All</option>
                            <option value="Admitted">Admitted</option>
                            <option value="Discontinue">Discontinue</option>
                        </select>
                    </div>

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
                </div>

                <div className={styles.resetRow} style={{ marginBottom: '1rem' }}>
                    <button onClick={handleResetFilters} className={styles.resetFiltersBtn}>
                        Reset Filters
                    </button>
                </div>

                {!year ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }}>
                        Please select an Admission Year to view the report.
                    </div>
                ) : (
                    <div className={styles.tableContainer} style={{ overflowX: 'auto', maxHeight: '70vh' }}>
                        <table className={styles.table} style={{ whiteSpace: 'nowrap' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f9fafb' }}>
                                <tr>
                                    <th>College</th>
                                    <th>Year</th>
                                    <th>Quota</th>
                                    <th>Department</th>
                                    {columns.map(col => (
                                        <th key={col.key} style={{ textAlign: 'center' }}>{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {groupedRows.length > 0 ? (
                                    groupedRows.map((row, index) => {
                                        let style = {};
                                        let colSpan1 = 1;
                                        let colSpan2 = 1;
                                        if (row.type === 'quota_total') {
                                            style = { backgroundColor: '#f3f4f6', fontWeight: 'bold' };
                                            colSpan1 = 2;
                                        } else if (row.type === 'year_total') {
                                            style = { backgroundColor: '#e5e7eb', fontWeight: 'bold' };
                                            colSpan1 = 3;
                                        } else if (row.type === 'grand_total') {
                                            style = { backgroundColor: '#d1d5db', fontWeight: 'bold' };
                                            colSpan1 = 4;
                                        }

                                        return (
                                            <tr key={index} style={style}>
                                                {row.type === 'data' ? (
                                                    <>
                                                        <td><strong>{row.displayCollege}</strong></td>
                                                        <td>{row.displayYear}</td>
                                                        <td>{row.displayQuota}</td>
                                                        <td>{row.department}</td>
                                                    </>
                                                ) : row.type === 'quota_total' ? (
                                                    <>
                                                        <td></td>
                                                        <td></td>
                                                        <td colSpan="2">{row.label}</td>
                                                    </>
                                                ) : row.type === 'year_total' ? (
                                                    <>
                                                        <td></td>
                                                        <td colSpan="3">{row.label}</td>
                                                    </>
                                                ) : (
                                                    <td colSpan="4" style={{ textAlign: 'center' }}>{row.label}</td>
                                                )}
                                                
                                                {columns.map(col => (
                                                    <td key={col.key} style={{ textAlign: 'center' }}>{row[col.key] || ''}</td>
                                                ))}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                         <td colSpan={4 + columns.length} style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificateCountReportNPC;
