import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Search, RotateCcw, Download, Building2, Users, TrendingUp, Database, FileSpreadsheet } from 'lucide-react';
import apiService from '../../services/api.service';
import styles from '../../components/css/ConsolidateReport.module.css';

const ConsolidateReport = () => {
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({ institutions: [], departments: [], quotaTypes: [], admissionYears: [], deptMapping: [] });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedInstitutions, setSelectedInstitutions] = useState([]);
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedQuotaTypes, setSelectedQuotaTypes] = useState([]);
    const [selectedAdmissionYears, setSelectedAdmissionYears] = useState([]);

    // Filter departments based on selected institutions
    const availableDepartments = useMemo(() => {
        if (selectedInstitutions.length === 0 || !filters.deptMapping) {
            return filters.departments || [];
        }
        const matchedDepts = new Set();
        filters.deptMapping.forEach(mapping => {
            if (selectedInstitutions.includes(mapping.institution)) {
                matchedDepts.add(mapping.department);
            }
        });
        return Array.from(matchedDepts).sort();
    }, [selectedInstitutions, filters.departments, filters.deptMapping]);

    // Fetch filter options on mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await apiService.get('/consolidate-report/filters');
                if (res.data.success) {
                    setFilters(res.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch filters:', err);
            }
        };
        fetchFilters();
    }, []);

    // Fetch report data whenever filters change
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = {};
                if (search) params.search = search;
                if (selectedInstitutions.length > 0) params.institution = selectedInstitutions.join(',');
                if (selectedDepartments.length > 0) params.department = selectedDepartments.join(',');
                if (selectedQuotaTypes.length > 0) params.quota_type = selectedQuotaTypes.join(',');
                if (selectedAdmissionYears.length > 0) params.admission_year = selectedAdmissionYears.join(',');

                const res = await apiService.get('/consolidate-report', { params });
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch consolidate report:', err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchData, 300);
        return () => clearTimeout(timer);
    }, [search, selectedInstitutions, selectedDepartments, selectedQuotaTypes, selectedAdmissionYears]);

    // Build grouped structure: institution → quota_type → rows
    const groupedData = useMemo(() => {
        const groups = [];
        let currentInst = null;
        let currentQuota = null;
        let quotaGroup = null;
        let instGroup = null;

        data.forEach(row => {
            const inst = row.institution || '(No Institution)';
            const quota = row.quota_type || '(No Quota)';

            if (inst !== currentInst) {
                // New institution
                currentInst = inst;
                currentQuota = null;
                instGroup = { institution: inst, quotaGroups: [] };
                groups.push(instGroup);
            }

            if (quota !== currentQuota) {
                // New quota group within this institution
                currentQuota = quota;
                quotaGroup = { quota, rows: [] };
                instGroup.quotaGroups.push(quotaGroup);
            }

            quotaGroup.rows.push(row);
        });

        return groups;
    }, [data]);

    // Summary stats
    const summary = useMemo(() => {
        const totalIntake = data.reduce((sum, r) => sum + (Number(r.intake) || 0), 0);
        const totalAdmitted = data.reduce((sum, r) => sum + (Number(r.total_admitted_count) || 0), 0);
        const totalYesterday = data.reduce((sum, r) => sum + (Number(r.upto_yesterday_count) || 0), 0);
        const uniqueInst = new Set(data.map(r => r.institution)).size;
        return { totalIntake, totalAdmitted, totalYesterday, uniqueInst };
    }, [data]);

    const handleReset = () => {
        setSearch('');
        setSelectedInstitutions([]);
        setSelectedDepartments([]);
        setSelectedQuotaTypes([]);
        setSelectedAdmissionYears([]);
    };

    // Compute subtotals for a quota group
    const getSubtotals = (rows) => {
        const count = rows.length;
        const intake = rows.reduce((s, r) => s + (Number(r.intake) || 0), 0);
        const admitted = rows.reduce((s, r) => s + (Number(r.total_admitted_count) || 0), 0);
        const balance = intake - admitted;
        const yesterday = rows.reduce((s, r) => s + (Number(r.upto_yesterday_count) || 0), 0);
        const today = rows.reduce((s, r) => s + (Number(r.today_admitted_count) || 0), 0);
        return { count, intake, admitted, balance, yesterday, today };
    };

    // Export to CSV
    const handleExportCSV = () => {
        if (data.length === 0) return;
        const headers = ['Institution', 'Quota Type', 'Department', 'Admission Year', 'Intake', 'Admitted', 'Balance', 'Upto Yesterday', 'Today', 'Percentage'];
        const csvRows = [headers.join(',')];
        data.forEach(row => {
            const intake = Number(row.intake) || 0;
            const admitted = Number(row.total_admitted_count) || 0;
            const balance = intake - admitted;
            const today = Number(row.today_admitted_count) || 0;
            const pct = intake > 0 ? ((admitted / intake) * 100).toFixed(2) : '0.00';
            csvRows.push([
                `"${row.institution || ''}"`,
                `"${row.quota_type || ''}"`,
                `"${row.department || ''}"`,
                `"${row.admission_year || ''}"`,
                intake,
                admitted,
                balance,
                Number(row.upto_yesterday_count) || 0,
                today,
                pct
            ].join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `consolidate_report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.page}>
            <div className={styles.mainCard}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.titleBlock}>
                        <h1 className={styles.title}>
                            <span className={styles.titleIcon}>
                                <BarChart3 size={22} />
                            </span>
                            Consolidate Report
                        </h1>
                        <p className={styles.subtitle}>Admission consolidate report across all institutions and departments</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span className={styles.badge}>
                            <Database size={14} />
                            {data.length} Records
                        </span>
                        <button className={styles.exportBtn} onClick={handleExportCSV} disabled={data.length === 0}>
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <div className={`${styles.summaryIconWrap} ${styles.blue}`}>
                            <Building2 size={22} />
                        </div>
                        <div className={styles.summaryInfo}>
                            <span className={styles.summaryLabel}>Institutions</span>
                            <span className={styles.summaryValue}>{summary.uniqueInst}</span>
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={`${styles.summaryIconWrap} ${styles.violet}`}>
                            <Users size={22} />
                        </div>
                        <div className={styles.summaryInfo}>
                            <span className={styles.summaryLabel}>Total Intake</span>
                            <span className={styles.summaryValue}>{summary.totalIntake}</span>
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={`${styles.summaryIconWrap} ${styles.emerald}`}>
                            <TrendingUp size={22} />
                        </div>
                        <div className={styles.summaryInfo}>
                            <span className={styles.summaryLabel}>Total Admitted</span>
                            <span className={styles.summaryValue}>{summary.totalAdmitted}</span>
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={`${styles.summaryIconWrap} ${styles.amber}`}>
                            <FileSpreadsheet size={22} />
                        </div>
                        <div className={styles.summaryInfo}>
                            <span className={styles.summaryLabel}>Upto Yesterday</span>
                            <span className={styles.summaryValue}>{summary.totalYesterday}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filtersCard}>
                    <div className={styles.filtersRow} style={{ marginBottom: '1rem', justifyContent: 'space-between' }}>
                        <div className={`${styles.filterGroup} ${styles.searchGroup}`} style={{ flex: 1, maxWidth: '400px' }}>
                            <label className={styles.filterLabel}>Global Search</label>
                            <div className={styles.searchInputWrapper}>
                                <Search size={16} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Search institution, department, quota..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <button className={styles.resetBtn} onClick={handleReset} style={{ alignSelf: 'flex-end' }}>
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    </div>

                    {/* Checkbox Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Institutions */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Institutions</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {filters.institutions.map(inst => (
                                    <label key={inst} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedInstitutions.includes(inst)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedInstitutions(prev => [...prev, inst]);
                                                else setSelectedInstitutions(prev => prev.filter(v => v !== inst));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {inst}
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

                        {/* Quota Types */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Quota Types</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {filters.quotaTypes.map(qt => (
                                    <label key={qt} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedQuotaTypes.includes(qt)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedQuotaTypes(prev => [...prev, qt]);
                                                else setSelectedQuotaTypes(prev => prev.filter(v => v !== qt));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {qt}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Admission Years */}
                        <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <label className={styles.filterLabel} style={{ marginBottom: '0.75rem', display: 'block', color: '#334155' }}>Admission Year</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {filters.admissionYears?.map(yr => (
                                    <label key={yr} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedAdmissionYears.includes(yr)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedAdmissionYears(prev => [...prev, yr]);
                                                else setSelectedAdmissionYears(prev => prev.filter(v => v !== yr));
                                            }}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                                        />
                                        {yr}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <span className={styles.loadingText}>Loading consolidate report...</span>
                    </div>
                ) : groupedData.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <BarChart3 size={28} />
                        </div>
                        <span className={styles.emptyTitle}>No Records Found</span>
                        <span className={styles.emptyText}>Try adjusting your search or filter criteria</span>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Institution</th>
                                    <th>Quota</th>
                                    <th>Department</th>
                                    <th style={{ textAlign: 'center' }}>Year</th>
                                    <th style={{ textAlign: 'center' }}>Intake</th>
                                    <th style={{ textAlign: 'center' }}>Admitted</th>
                                    <th style={{ textAlign: 'center' }}>Balance</th>
                                    <th style={{ textAlign: 'center' }}>Upto Yesterday</th>
                                    <th style={{ textAlign: 'center' }}>Today</th>
                                    <th style={{ textAlign: 'center' }}>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedData.map((instGroup, gi) => {
                                    // Count total rows in this institution group for rowSpan
                                    const instTotalRows = instGroup.quotaGroups.reduce((s, qg) => s + qg.rows.length + 1, 0); // +1 per quota for subtotal row
                                    let isFirstInstRow = true;

                                    return instGroup.quotaGroups.map((qGroup, qi) => {
                                        const sub = getSubtotals(qGroup.rows);
                                        let isFirstQuotaRow = true;

                                        const dataRows = qGroup.rows.map((row, ri) => {
                                            const intake = Number(row.intake) || 0;
                                            const admitted = Number(row.total_admitted_count) || 0;
                                            const balance = intake - admitted;
                                            const yesterday = Number(row.upto_yesterday_count) || 0;
                                            const today = Number(row.today_admitted_count) || 0;
                                            const pct = intake > 0 ? ((admitted / intake) * 100).toFixed(2) : '0.00';

                                            const rowEl = (
                                                <tr key={`${gi}-${qi}-${ri}`} className={styles.dataRow}>
                                                    {isFirstInstRow && (
                                                        <td rowSpan={instTotalRows} className={styles.instCell}>
                                                            <span className={styles.institutionBadge}>{instGroup.institution}</span>
                                                        </td>
                                                    )}
                                                    {isFirstQuotaRow && (
                                                        <td rowSpan={qGroup.rows.length + 1} className={styles.quotaCell}>
                                                            <span className={`${styles.quotaBadge} ${getQuotaClass(qGroup.quota)}`}>
                                                                {qGroup.quota}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className={styles.departmentCell}>{row.department || '—'}</td>
                                                    <td className={styles.centerCell}>{row.admission_year || <span className={styles.nullText}>—</span>}</td>
                                                    <td className={styles.numCell}>{intake}</td>
                                                    <td className={styles.numCell}>{admitted}</td>
                                                    <td className={`${styles.numCell} ${balance < 0 ? styles.negative : ''}`}>{balance}</td>
                                                    <td className={styles.numCell}>{yesterday}</td>
                                                    <td className={styles.numCell}>{today}</td>
                                                    <td className={styles.numCell}>{pct}</td>
                                                </tr>
                                            );

                                            isFirstInstRow = false;
                                            isFirstQuotaRow = false;
                                            return rowEl;
                                        });

                                        // Subtotal row for this quota group
                                        const subtotalRow = (
                                            <tr key={`sub-${gi}-${qi}`} className={styles.subtotalRow}>
                                                <td className={styles.subtotalLabel}>COUNT={sub.count}</td>
                                                <td></td>
                                                <td className={styles.subtotalVal}>SUM={sub.intake}</td>
                                                <td className={styles.subtotalVal}>SUM={sub.admitted}</td>
                                                <td className={styles.subtotalVal}>SUM={sub.balance}</td>
                                                <td className={styles.subtotalVal}>SUM={sub.yesterday}</td>
                                                <td className={styles.subtotalVal}>SUM={sub.today}</td>
                                                <td></td>
                                            </tr>
                                        );

                                        return [...dataRows, subtotalRow];
                                    });
                                })}
                                {/* GRAND TOTAL ROW */}
                                <tr className={styles.subtotalRow} style={{ backgroundColor: '#e2e8f0' }}>
                                    <td colSpan="4" className={styles.subtotalLabel} style={{ textAlign: 'right', paddingRight: '1rem', color: '#1e293b' }}>GRAND TOTAL</td>
                                    <td className={styles.subtotalVal} style={{ color: '#0f172a' }}>SUM={summary.totalIntake}</td>
                                    <td className={styles.subtotalVal} style={{ color: '#0f172a' }}>SUM={summary.totalAdmitted}</td>
                                    <td className={styles.subtotalVal} style={{ color: '#0f172a' }}>SUM={summary.totalIntake - summary.totalAdmitted}</td>
                                    <td className={styles.subtotalVal} style={{ color: '#0f172a' }}>SUM={summary.totalYesterday}</td>
                                    <td className={styles.subtotalVal} style={{ color: '#0f172a' }}>SUM={data.reduce((sum, r) => sum + (Number(r.today_admitted_count) || 0), 0)}</td>
                                    <td className={styles.subtotalVal} style={{ color: '#0f172a' }}>
                                        {summary.totalIntake > 0 ? ((summary.totalAdmitted / summary.totalIntake) * 100).toFixed(2) + '%' : '0.00%'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const getQuotaClass = (type) => {
    if (!type) return '';
    const t = type.toLowerCase();
    if (t.includes('counselling')) return 'counselling';
    if (t.includes('management')) return 'management';
    return 'other';
};

export default ConsolidateReport;
