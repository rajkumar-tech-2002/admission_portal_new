import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, BarChart3, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const AOReferenceTypeReport = () => {
    const [records, setRecords] = useState([]);
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
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedQuotas, setSelectedQuotas] = useState([]);

    const availableDepartments = useMemo(() => {
        if (selectedColleges.length === 0) return masterData.departments;
        return [...new Set(records.filter(a => selectedColleges.includes(a.college)).map(a => a.department).filter(Boolean))].sort();
    }, [selectedColleges, masterData.departments, records]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiService.get('/admissions/reports/reference-type-count');
                
                if (res.data.success) {
                    const data = res.data.data || [];
                    setRecords(data);
                    
                    const uniqueColleges = [...new Set(data.map(a => a.college).filter(Boolean))].sort();
                    const uniqueYears = [...new Set(data.map(a => a.admission_year).filter(Boolean))].sort();
                    const uniqueDepts = [...new Set(data.map(a => a.department).filter(Boolean))].sort();
                    const uniqueQuotas = [...new Set(data.map(a => a.quota).filter(Boolean))].sort();
                    
                    setMasterData({
                        colleges: uniqueColleges,
                        departments: uniqueDepts,
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
    }, []);

    useEffect(() => {
        let result = records;

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
        if (selectedDepartments.length > 0) result = result.filter(r => selectedDepartments.includes(r.department || ''));
        if (selectedQuotas.length > 0) result = result.filter(r => selectedQuotas.includes(r.quota || ''));

        setFilteredRecords(result);
    }, [records, search, selectedColleges, selectedYears, selectedDepartments, selectedQuotas]);

    useEffect(() => {
        // Process grouping
        const data = filteredRecords;
        let rows = [];
        
        const collegesList = [...new Set(data.map(d => d.college))].sort();
        
        let grandTotals = {
            our_staff_count: 0,
            direct_count: 0,
            agent_count: 0,
            others_count: 0,
            our_students_count: 0,
            // total_count: 0
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
        setSelectedDepartments([]);
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
                'Our Staff Count': r.our_staff_count || 0,
                'Direct Count': r.direct_count || 0,
                'Agent Count': r.agent_count || 0,
                'Others Count': r.others_count || 0,
                'Our Students Count': r.our_students_count || 0,
                // 'Total Count': r.total_count || 0
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
        XLSX.utils.book_append_sheet(wb, ws, "Reference_Type_Count_Report");
        XLSX.writeFile(wb, `Reference_Type_Count_Report_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Reference Type Count Report</h2>
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

                        {/* Departments */}
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
                                <th style={{ textAlign: 'center' }}>Our Staff Count</th>
                                <th style={{ textAlign: 'center' }}>Direct Count</th>
                                <th style={{ textAlign: 'center' }}>Agent Count</th>
                                <th style={{ textAlign: 'center' }}>Others Count</th>
                                <th style={{ textAlign: 'center' }}>Our Students Count</th>
                                {/* <th style={{ textAlign: 'center' }}>Total Count</th> */}
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
                                                <td style={{ textAlign: 'center' }}>{row.our_staff_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.direct_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.agent_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.others_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.our_students_count || ''}</td>
                                                {/* <td style={{ textAlign: 'center' }}>{row.total_count || ''}</td> */}
                                            </tr>
                                        );
                                    } else if (row.type === 'quota_total') {
                                        return (
                                            <tr key={index} style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                                                <td></td>
                                                <td></td>
                                                <td colSpan="2">{row.label}</td>
                                                <td style={{ textAlign: 'center' }}>{row.our_staff_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.direct_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.agent_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.others_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.our_students_count || ''}</td>
                                                {/* <td style={{ textAlign: 'center' }}>{row.total_count || ''}</td> */}
                                            </tr>
                                        );
                                    } else if (row.type === 'year_total') {
                                        return (
                                            <tr key={index} style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
                                                <td></td>
                                                <td colSpan="3">{row.label}</td>
                                                <td style={{ textAlign: 'center' }}>{row.our_staff_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.direct_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.agent_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.others_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.our_students_count || ''}</td>
                                                {/* <td style={{ textAlign: 'center' }}>{row.total_count || ''}</td> */}
                                            </tr>
                                        );
                                    } else if (row.type === 'grand_total') {
                                        return (
                                            <tr key={index} style={{ backgroundColor: '#d1d5db', fontWeight: 'bold' }}>
                                                <td colSpan="4" style={{ textAlign: 'center' }}>{row.label}</td>
                                                <td style={{ textAlign: 'center' }}>{row.our_staff_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.direct_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.agent_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.others_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.our_students_count || ''}</td>
                                                {/* <td style={{ textAlign: 'center' }}>{row.total_count || ''}</td> */}
                                            </tr>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <tr>
                                     <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AOReferenceTypeReport;
