import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, BarChart3, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const AOReferenceYearWiseReport = () => {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [groupedRows, setGroupedRows] = useState([]);
    
    const [masterData, setMasterData] = useState({
        referenceTypes: [],
        referenceColleges: [],
        referenceDepartments: []
    });

    // Filters
    const [search, setSearch] = useState('');
    const [selectedReferenceTypes, setSelectedReferenceTypes] = useState([]);
    const [selectedReferenceColleges, setSelectedReferenceColleges] = useState([]);
    const [selectedReferenceDepartments, setSelectedReferenceDepartments] = useState([]);

    const availableDepartments = useMemo(() => {
        if (selectedReferenceColleges.length === 0) return masterData.referenceDepartments;
        return [...new Set(records.filter(a => selectedReferenceColleges.includes(a.reference_college)).map(a => a.reference_department).filter(Boolean))].sort();
    }, [selectedReferenceColleges, masterData.referenceDepartments, records]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiService.get('/admissions/reports/reference-year-wise-admission-count');
                
                if (res.data.success) {
                    const data = res.data.data || [];
                    setRecords(data);
                    
                    const uniqueTypes = [...new Set(data.map(a => a.reference_type).filter(Boolean))].sort();
                    const uniqueColleges = [...new Set(data.map(a => a.reference_college).filter(Boolean))].sort();
                    const uniqueDepts = [...new Set(data.map(a => a.reference_department).filter(Boolean))].sort();
                    
                    setMasterData({
                        referenceTypes: uniqueTypes,
                        referenceColleges: uniqueColleges,
                        referenceDepartments: uniqueDepts
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
                (r.reference_type || '').toLowerCase().includes(lowerSearch) ||
                (r.reference_college || '').toLowerCase().includes(lowerSearch) ||
                (r.reference_department || '').toLowerCase().includes(lowerSearch) ||
                (r.reference_by_name || '').toLowerCase().includes(lowerSearch)
            );
        }

        if (selectedReferenceTypes.length > 0) result = result.filter(r => selectedReferenceTypes.includes((r.reference_type || '').trim()));
        if (selectedReferenceColleges.length > 0) result = result.filter(r => selectedReferenceColleges.includes((r.reference_college || '').trim()));
        if (selectedReferenceDepartments.length > 0) result = result.filter(r => selectedReferenceDepartments.includes((r.reference_department || '').trim()));

        setFilteredRecords(result);
    }, [records, search, selectedReferenceTypes, selectedReferenceColleges, selectedReferenceDepartments]);

    // Grouping logic: reference_type → reference_college → reference_department → rows
    useEffect(() => {
        const data = filteredRecords;
        let rows = [];

        const numFields = ['I_Year', 'II_Year_LE', 'Total_Admitted'];
        
        const initTotals = () => {
            const t = {};
            numFields.forEach(f => t[f] = 0);
            return t;
        };

        const addTotals = (target, row) => {
            numFields.forEach(f => {
                target[f] += (Number(row[f]) || 0);
            });
        };

        const typesList = [...new Set(data.map(d => d.reference_type))].sort();
        let grandTotals = initTotals();

        typesList.forEach((type, typeIndex) => {
            const typeData = data.filter(d => d.reference_type === type);
            const collegesList = [...new Set(typeData.map(d => d.reference_college))].sort();
            let typeTotals = initTotals();

            collegesList.forEach((col, colIndex) => {
                const colData = typeData.filter(d => d.reference_college === col);
                const deptsList = [...new Set(colData.map(d => d.reference_department))].sort();
                let colTotals = initTotals();

                deptsList.forEach((dept, deptIndex) => {
                    const deptData = colData.filter(d => d.reference_department === dept);
                    deptData.sort((a, b) => (a.reference_by_name || '').localeCompare(b.reference_by_name || ''));

                    deptData.forEach((row, rIndex) => {
                        addTotals(colTotals, row);
                        addTotals(typeTotals, row);
                        addTotals(grandTotals, row);

                        rows.push({
                            type: 'data',
                            displayType: (colIndex === 0 && deptIndex === 0 && rIndex === 0) ? type : '',
                            displayCollege: (deptIndex === 0 && rIndex === 0) ? col : '',
                            displayDepartment: (rIndex === 0) ? dept : '',
                            reference_by_name: row.reference_by_name,
                            ...row
                        });
                    });
                });

                // College subtotal
                rows.push({
                    type: 'college_total',
                    label: `${col || 'Unknown'} Total`,
                    ...colTotals
                });
            });

            // Type subtotal
            rows.push({
                type: 'type_total',
                label: `${type || 'Unknown'} Total`,
                ...typeTotals
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
        setSelectedReferenceTypes([]);
        setSelectedReferenceColleges([]);
        setSelectedReferenceDepartments([]);
    };

    const handleExportRecords = () => {
        if (groupedRows.length === 0) return toast.error("No records to export");
        
        const exportData = groupedRows.map(r => {
            let rowData = {
                'Reference Type': '',
                'Reference College': '',
                'Reference Department': '',
                'Reference By Name': '',
                'I Year': r.I_Year || 0,
                'II Year (LE)': r.II_Year_LE || 0,
                'Total Admitted': r.Total_Admitted || 0
            };

            if (r.type === 'data') {
                rowData['Reference Type'] = r.displayType;
                rowData['Reference College'] = r.displayCollege;
                rowData['Reference Department'] = r.displayDepartment;
                rowData['Reference By Name'] = r.reference_by_name;
            } else if (r.type === 'college_total') {
                rowData['Reference College'] = r.label;
            } else if (r.type === 'type_total') {
                rowData['Reference Type'] = r.label;
            } else if (r.type === 'grand_total') {
                rowData['Reference Type'] = r.label;
            }

            return rowData;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Year_Wise_Count_Report");
        XLSX.writeFile(wb, `Year_Wise_Count_Report_${new Date().getTime()}.xlsx`);
    };

    const numCols = ['I_Year', 'II_Year_LE', 'Total_Admitted'];
    const numHeaders = ['I Year', 'II Year (LE)', 'Total Admitted'];

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Year Wise Contribution Report</h2>
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
                                    placeholder="Search type, college, department, name..."
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
                        {/* Reference Types */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Reference Types</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {masterData.referenceTypes.map((t, i) => (
                                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedReferenceTypes.includes(t)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedReferenceTypes(prev => [...prev, t]);
                                                else setSelectedReferenceTypes(prev => prev.filter(v => v !== t));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {t}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Reference Colleges */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Reference Colleges</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {masterData.referenceColleges.map((c, index) => (
                                    <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedReferenceColleges.includes(c)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedReferenceColleges(prev => [...prev, c]);
                                                else setSelectedReferenceColleges(prev => prev.filter(v => v !== c));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {c}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Reference Departments */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Reference Departments</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {availableDepartments.map((d, index) => (
                                    <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedReferenceDepartments.includes(d)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedReferenceDepartments(prev => [...prev, d]);
                                                else setSelectedReferenceDepartments(prev => prev.filter(v => v !== d));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {d}
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
                                <th>Reference Type</th>
                                <th>Reference College</th>
                                <th>Reference Department</th>
                                <th>Reference By Name</th>
                                {numHeaders.map((h, i) => (
                                    <th key={i} style={{ textAlign: 'center' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {groupedRows.length > 0 ? (
                                groupedRows.map((row, index) => {
                                    if (row.type === 'data') {
                                        return (
                                            <tr key={index}>
                                                <td><strong>{row.displayType}</strong></td>
                                                <td>{row.displayCollege}</td>
                                                <td>{row.displayDepartment}</td>
                                                <td>{row.reference_by_name}</td>
                                                {numCols.map((col, ci) => (
                                                    <td key={ci} style={{ textAlign: 'center' }}>{row[col] || ''}</td>
                                                ))}
                                            </tr>
                                        );
                                    } else if (row.type === 'college_total') {
                                        return (
                                            <tr key={index} className={styles.subtotalRow}>
                                                <td></td>
                                                <td colSpan="3" className={styles.subtotalLabel}>{row.label}</td>
                                                {numCols.map((col, ci) => (
                                                    <td key={ci} className={styles.subtotalVal}>SUM={row[col] || 0}</td>
                                                ))}
                                            </tr>
                                        );
                                    } else if (row.type === 'type_total') {
                                        return (
                                            <tr key={index} className={styles.subtotalRow}>
                                                <td colSpan="4" className={styles.subtotalLabel}>{row.label}</td>
                                                {numCols.map((col, ci) => (
                                                    <td key={ci} className={styles.subtotalVal}>SUM={row[col] || 0}</td>
                                                ))}
                                            </tr>
                                        );
                                    } else if (row.type === 'grand_total') {
                                        return (
                                            <tr key={index} className={styles.subtotalRow}>
                                                <td colSpan="4" className={styles.subtotalLabel} style={{ textAlign: 'right', paddingRight: '1rem' }}>{row.label}</td>
                                                {numCols.map((col, ci) => (
                                                    <td key={ci} className={styles.subtotalVal}>SUM={row[col] || 0}</td>
                                                ))}
                                            </tr>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <tr>
                                     <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AOReferenceYearWiseReport;
