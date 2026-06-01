import React, { useState, useEffect } from 'react';
import { Search, Download, BarChart3, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const AOCommunityReport = () => {
    const [admissions, setAdmissions] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [groupedRows, setGroupedRows] = useState([]);
    
    const [masterData, setMasterData] = useState({
        colleges: [],
        departments: [],
        years: [],
        quotas: []
    });

    // Checkbox Filters
    const [search, setSearch] = useState('');
    const [selectedColleges, setSelectedColleges] = useState([]);
    const [selectedYears, setSelectedYears] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]); // Department
    const [selectedQuotas, setSelectedQuotas] = useState([]);

    const availableCourses = React.useMemo(() => {
        if (selectedColleges.length === 0) return masterData.departments;
        return [...new Set(admissions.filter(a => selectedColleges.includes(a.college)).map(a => a.department).filter(Boolean))].sort();
    }, [selectedColleges, masterData.departments, admissions]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [admRes, masterRes] = await Promise.all([
                    apiService.get('/admissions/reports/community-wise'),
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
                    
                    setMasterData({
                        colleges: uniqueColleges,
                        departments: uniqueCourses,
                        years: uniqueYears,
                        quotas: uniqueQuotas
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

        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(r => 
                (r.college || '').toLowerCase().includes(lowerSearch) ||
                (r.department || '').toLowerCase().includes(lowerSearch) ||
                (r.admission_year || '').toLowerCase().includes(lowerSearch) ||
                (r.quota || '').toLowerCase().includes(lowerSearch)
            );
        }

        if (selectedColleges.length > 0) result = result.filter(r => selectedColleges.includes((r.college || '').trim()));
        if (selectedYears.length > 0) result = result.filter(r => selectedYears.includes(r.admission_year || ''));
        if (selectedCourses.length > 0) result = result.filter(r => selectedCourses.includes(r.department || ''));
        if (selectedQuotas.length > 0) result = result.filter(r => selectedQuotas.includes(r.quota || ''));

        setFilteredRecords(result);
    }, [admissions, search, selectedColleges, selectedYears, selectedCourses, selectedQuotas]);

    useEffect(() => {
        // Process grouping
        const data = filteredRecords;
        let rows = [];
        
        const collegesList = [...new Set(data.map(d => d.college))].sort();
        
        let grandTotals = {
            total_students: 0,
            BC_Count: 0,
            BCM_Count: 0,
            MBC_Count: 0,
            SC_Count: 0,
            SCA_Count: 0,
            ST_Count: 0,
            OC_Count: 0,
            Others_Count: 0
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
        setSearch('');
        setSelectedColleges([]);
        setSelectedYears([]);
        setSelectedCourses([]);
        setSelectedQuotas([]);
    };

    const handleExportRecords = () => {
        if (groupedRows.length === 0) return toast.error("No records to export");
        
        const exportData = groupedRows.map(r => {
            let rowData = {
                'College': '',
                'Year': '',
                'Quota': '',
                'Department': '',
                'Total Students': r.total_students || 0,
                'BC': r.BC_Count || 0,
                'BCM': r.BCM_Count || 0,
                'MBC': r.MBC_Count || 0,
                'SC': r.SC_Count || 0,
                'SCA': r.SCA_Count || 0,
                'ST': r.ST_Count || 0,
                'OC': r.OC_Count || 0,
                'Others': r.Others_Count || 0
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

            return rowData;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Community_Admission_Report");
        XLSX.writeFile(wb, `Community_Admission_Report_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Community Wise Admission Report</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={handleExportRecords} className={styles.exportBtn}>
                            <Download size={18} /> Export Excel
                        </button>
                    </div>
                </div>

                {/* Checkbox Filters */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                        <div className={styles.filterGroup} style={{ flex: 1, maxWidth: '400px' }}>
                            <label className={styles.filterLabel}>Global Search</label>
                            <div className={styles.searchInputWrapper} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Search size={16} className={styles.searchIcon} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    style={{ paddingLeft: '32px', width: '100%', padding: '8px 8px 8px 32px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    placeholder="Search college, department, quota..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <button className={styles.resetFiltersBtn} onClick={handleResetFilters} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: 'fit-content', alignSelf: 'flex-end' }}>
                            <RotateCcw size={14} /> Reset Filters
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Colleges */}
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

                        {/* Years */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Admission Years</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {masterData.years.map(yr => (
                                    <label key={yr} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedYears.includes(yr)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedYears(prev => [...prev, yr]);
                                                else setSelectedYears(prev => prev.filter(v => v !== yr));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {yr}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Courses */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Courses (Departments)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {availableCourses.map(dept => (
                                    <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedCourses.includes(dept)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedCourses(prev => [...prev, dept]);
                                                else setSelectedCourses(prev => prev.filter(v => v !== dept));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {dept}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Quotas */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Quotas</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {masterData.quotas.map(qt => (
                                    <label key={qt} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedQuotas.includes(qt)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedQuotas(prev => [...prev, qt]);
                                                else setSelectedQuotas(prev => prev.filter(v => v !== qt));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {qt}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.tableContainer} style={{ overflowX: 'auto', maxHeight: '70vh' }}>
                    <table className={styles.table} style={{ whiteSpace: 'nowrap' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f9fafb' }}>
                            <tr>
                                <th>College</th>
                                <th>Year</th>
                                <th>Quota</th>
                                <th>Department</th>
                                <th style={{ textAlign: 'center' }}>Total Students</th>
                                <th style={{ textAlign: 'center' }}>BC</th>
                                <th style={{ textAlign: 'center' }}>BCM</th>
                                <th style={{ textAlign: 'center' }}>MBC</th>
                                <th style={{ textAlign: 'center' }}>SC</th>
                                <th style={{ textAlign: 'center' }}>SCA</th>
                                <th style={{ textAlign: 'center' }}>ST</th>
                                <th style={{ textAlign: 'center' }}>OC</th>
                                <th style={{ textAlign: 'center' }}>Others</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedRows.length > 0 ? (
                                groupedRows.map((row, index) => {
                                    if (row.type === 'data') {
                                        return (
                                            <tr key={index}>
                                                <td><strong>{row.displayCollege}</strong></td>
                                                <td>{row.displayYear}</td>
                                                <td>{row.displayQuota}</td>
                                                <td>{row.department}</td>
                                                <td style={{ textAlign: 'center' }}>{row.total_students || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.BC_Count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.BCM_Count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.MBC_Count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.SC_Count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.SCA_Count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.ST_Count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.OC_Count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.Others_Count || ''}</td>
                                            </tr>
                                        );
                                    } else if (row.type === 'quota_total') {
                                        return (
                                            <tr key={index} className={styles.subtotalRow}>
                                                <td></td>
                                                <td></td>
                                                <td colSpan="2" className={styles.subtotalLabel}>{row.label}</td>
                                                <td className={styles.subtotalVal}>SUM={row.total_students || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.BC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.BCM_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.MBC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.SC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.SCA_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.ST_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.OC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.Others_Count || 0}</td>
                                            </tr>
                                        );
                                    } else if (row.type === 'year_total') {
                                        return (
                                            <tr key={index} className={styles.subtotalRow}>
                                                <td></td>
                                                <td colSpan="3" className={styles.subtotalLabel}>{row.label}</td>
                                                <td className={styles.subtotalVal}>SUM={row.total_students || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.BC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.BCM_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.MBC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.SC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.SCA_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.ST_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.OC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.Others_Count || 0}</td>
                                            </tr>
                                        );
                                    } else if (row.type === 'grand_total') {
                                        return (
                                            <tr key={index} className={styles.subtotalRow}>
                                                <td colSpan="4" className={styles.subtotalLabel} style={{ textAlign: 'right', paddingRight: '1rem' }}>{row.label}</td>
                                                <td className={styles.subtotalVal}>SUM={row.total_students || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.BC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.BCM_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.MBC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.SC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.SCA_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.ST_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.OC_Count || 0}</td>
                                                <td className={styles.subtotalVal}>SUM={row.Others_Count || 0}</td>
                                            </tr>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <tr>
                                     <td colSpan="13" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AOCommunityReport;
