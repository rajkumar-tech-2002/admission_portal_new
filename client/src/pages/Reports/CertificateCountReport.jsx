import React, { useState, useEffect } from 'react';
import { Search, Download, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';

const CertificateCountReport = () => {
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [admRes, masterRes] = await Promise.all([
                    apiService.get('/admissions/reports/certificate-count'),
                    apiService.get('/master')
                ]);

                if (admRes.data.success) {
                    setAdmissions(admRes.data.data);
                }

                if (masterRes.data.success) {
                    const md = masterRes.data.data;
                    
                    const uniqueColleges = [...new Set(md.departments.map(d => d.institution).filter(Boolean))];
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
            tenth_marksheet_count: 0,
            eleventh_marksheet_count: 0,
            twelfth_temp_count: 0,
            twelfth_marksheet_count: 0,
            transfer_certificate_count: 0,
            community_certificate_count: 0,
            first_graduate_certificate_count: 0,
            income_certificate_count: 0,
            native_certificate_count: 0,
            bonafide_certificate_count: 0,
            JD_certificate_count: 0
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
                '10th MC': r.tenth_marksheet_count || 0,
                '11th MC': r.eleventh_marksheet_count || 0,
                '12th Temp': r.twelfth_temp_count || 0,
                '12th MC': r.twelfth_marksheet_count || 0,
                'TC': r.transfer_certificate_count || 0,
                'Community Cert': r.community_certificate_count || 0,
                'First Graduate': r.first_graduate_certificate_count || 0,
                'Income Cert': r.income_certificate_count || 0,
                'Native Cert': r.native_certificate_count || 0,
                'Bonafide Cert': r.bonafide_certificate_count || 0,
                'JD Cert': r.JD_certificate_count || 0
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
        XLSX.utils.book_append_sheet(wb, ws, "Certificate_Count_Report");
        XLSX.writeFile(wb, `Certificate_Count_Report_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{color:"var(--primary-color)", margin: 0}}>Certificate Count Report</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleExportRecords} className={styles.exportBtn}>
                            <Download size={18} /> Export Excel
                        </button>
                    </div>
                </div>

                <div className={styles.filters} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
                </div>

                <div className={styles.resetRow} style={{ marginBottom: '1rem' }}>
                    <button onClick={handleResetFilters} className={styles.resetFiltersBtn}>
                        Reset Filters
                    </button>
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
                                <th style={{ textAlign: 'center' }}>10th MC</th>
                                <th style={{ textAlign: 'center' }}>11th MC</th>
                                <th style={{ textAlign: 'center' }}>12th Temp</th>
                                <th style={{ textAlign: 'center' }}>12th MC</th>
                                <th style={{ textAlign: 'center' }}>TC</th>
                                <th style={{ textAlign: 'center' }}>Comm Cert</th>
                                <th style={{ textAlign: 'center' }}>First Grad</th>
                                <th style={{ textAlign: 'center' }}>Income</th>
                                <th style={{ textAlign: 'center' }}>Native</th>
                                <th style={{ textAlign: 'center' }}>Bonafide</th>
                                <th style={{ textAlign: 'center' }}>JD</th>
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
                                                <td style={{ textAlign: 'center' }}>{row.tenth_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.eleventh_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.twelfth_temp_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.twelfth_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.transfer_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.community_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.first_graduate_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.income_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.native_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.bonafide_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.JD_certificate_count || ''}</td>
                                            </tr>
                                        );
                                    } else if (row.type === 'quota_total') {
                                        return (
                                            <tr key={index} style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                                                <td></td>
                                                <td></td>
                                                <td colSpan="2">{row.label}</td>
                                                <td style={{ textAlign: 'center' }}>{row.total_students || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.tenth_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.eleventh_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.twelfth_temp_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.twelfth_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.transfer_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.community_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.first_graduate_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.income_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.native_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.bonafide_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.JD_certificate_count || ''}</td>
                                            </tr>
                                        );
                                    } else if (row.type === 'year_total') {
                                        return (
                                            <tr key={index} style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
                                                <td></td>
                                                <td colSpan="3">{row.label}</td>
                                                <td style={{ textAlign: 'center' }}>{row.total_students || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.tenth_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.eleventh_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.twelfth_temp_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.twelfth_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.transfer_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.community_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.first_graduate_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.income_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.native_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.bonafide_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.JD_certificate_count || ''}</td>
                                            </tr>
                                        );
                                    } else if (row.type === 'grand_total') {
                                        return (
                                            <tr key={index} style={{ backgroundColor: '#d1d5db', fontWeight: 'bold' }}>
                                                <td colSpan="4" style={{ textAlign: 'center' }}>{row.label}</td>
                                                <td style={{ textAlign: 'center' }}>{row.total_students || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.tenth_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.eleventh_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.twelfth_temp_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.twelfth_marksheet_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.transfer_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.community_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.first_graduate_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.income_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.native_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.bonafide_certificate_count || ''}</td>
                                                <td style={{ textAlign: 'center' }}>{row.JD_certificate_count || ''}</td>
                                            </tr>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <tr>
                                     <td colSpan="16" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CertificateCountReport;
