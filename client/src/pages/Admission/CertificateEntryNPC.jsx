import React, { useState, useEffect } from 'react';
import { Search, Save, Trash2, RefreshCw, Award, Download } from 'lucide-react';
import styles from '../../components/css/Dashboard.module.css';
import reportStyles from '../../components/css/RecordReport.module.css';
import toast from 'react-hot-toast';
import { confirmAction } from '../../components/layout/Toast';
import apiService from '../../services/api.service';

const CertificateEntryNPC = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);

    // Filters
    const [search, setSearch] = useState('');
    const [collegeFilter, setCollegeFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [quotaFilter, setQuotaFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [filteredRecords, setFilteredRecords] = useState([]);

    // Colleges, Depts & Years for dropdowns
    const [colleges, setColleges] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [years, setYears] = useState([]);
    const [quotas, setQuotas] = useState([]);
    const [statuses, setStatuses] = useState([]);

    // Editing State (track changes locally before save)
    const [editedRows, setEditedRows] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiService.get('/admissions/certificates-npc/list');
            if (res.data.success) {
                setRecords(res.data.data);

                // Extract unique colleges and departments
                const uniqueColleges = [...new Set(res.data.data.map(item => item.college).filter(Boolean))];
                const uniqueDepts = [...new Set(res.data.data.map(item => {
                    return (item.programme && item.programme.trim()) ? `${item.programme} - ${item.department}` : (item.department || '');
                }).filter(Boolean))].sort();
                const uniqueYears = [...new Set(res.data.data.map(item => item.admission_year).filter(Boolean))].sort();
                const uniqueQuotas = [...new Set(res.data.data.map(item => item.quota).filter(Boolean))].sort();
                const uniqueStatuses = [...new Set(res.data.data.map(item => item.student_status).filter(Boolean))].sort();

                setColleges(uniqueColleges);
                setDepartments(uniqueDepts);
                setYears(uniqueYears);
                setQuotas(uniqueQuotas);
                setStatuses(uniqueStatuses);
            }
        } catch (error) {
            console.error('Failed to fetch certificates:', error);
            toast.error('Failed to load records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let result = records;

        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(r =>
                (r.application_no || '').toLowerCase().includes(lowerSearch) ||
                (r.student_name || '').toLowerCase().includes(lowerSearch)
            );
        }
        if (collegeFilter) result = result.filter(r => r.college === collegeFilter);
        if (deptFilter) {
            result = result.filter(r => {
                const deptDisplay = (r.programme && r.programme.trim()) ? `${r.programme} - ${r.department}` : (r.department || '');
                return deptDisplay === deptFilter;
            });
        }
        if (yearFilter) result = result.filter(r => r.admission_year === yearFilter);
        if (quotaFilter) result = result.filter(r => r.quota === quotaFilter);
        if (statusFilter) result = result.filter(r => r.student_status === statusFilter);

        setFilteredRecords(result);
        setCurrentPage(1);
    }, [records, search, collegeFilter, deptFilter, yearFilter, quotaFilter, statusFilter]);

    const handleResetFilters = () => {
        setSearch('');
        setCollegeFilter('');
        setDeptFilter('');
        setYearFilter('');
        setQuotaFilter('');
        setStatusFilter('');
        setCurrentPage(1);
    };

    const showNonIYearFields = yearFilter !== 'I Year';
    const showIYearOnlyFields = yearFilter === 'I Year';

    // Excel Export
    const handleExcelExport = () => {
        if (filteredRecords.length === 0) { toast.error('No records to export'); return; }
        
        const headers = ['S.No','App No','Name','DOB','Status','College','Programme','Department','Year','Quota','Community',
            '10th MC'
        ];
        if (showIYearOnlyFields) headers.push('10th Temp');
        headers.push('TC','Community Cert','Photo (2 Copy)','Aadhaar','Equivalency Cert');
        
        if (showNonIYearFields) {
            headers.push('11th MC', '12th MC', '12th Temp', 'Migration Cert', 'MS ITI', 'ITI Prov', 'ITI Cert Add');
        }
        headers.push('Remarks');

        const rows = filteredRecords.map((r, i) => {
            const row = [
                i + 1, r.application_no, r.student_name, r.dob ? new Date(r.dob).toLocaleDateString('en-GB') : '', r.student_status, r.college, r.programme, r.department, r.admission_year || '', r.quota || '', r.community || '',
                r.ms_10 || ''
            ];
            
            if (showIYearOnlyFields) row.push(r.temp_10 || '');
            
            row.push(r.tc || '', r.community_cert || '', r.photo_2_copy || '', r.aadhaar || '', r.equivalency_cert || '');
            
            if (showNonIYearFields) {
                row.push(r.ms_11 || '', r.ms_12 || '', r.temp_12 || '', r.migration_cert || '', r.ms_iti || '', r.iti_prov || '', r.iti_cert_add || '');
            }
            row.push(r.remarks || '');
            return row;
        });

        const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'certificate_management_npc.csv'; a.click();
        URL.revokeObjectURL(url);
        toast.success('Excel exported successfully!');
    };

    const handleInputChange = (student_id, field, value) => {
        setEditedRows(prev => {
            const rowData = prev[student_id] || records.find(r => r.student_id === student_id);
            return {
                ...prev,
                [student_id]: {
                    ...rowData,
                    [field]: value,
                    isDirty: true
                }
            };
        });
    };

    const handleSave = async (student_id) => {
        const rowData = editedRows[student_id];
        if (!rowData || !rowData.isDirty) return;

        try {
            const payload = {
                student_id: rowData.student_id,
                student_application_no: rowData.application_no,
                student_year: rowData.admission_year,
                ms_10: rowData.ms_10,
                temp_10: rowData.temp_10,
                ms_11: rowData.ms_11,
                ms_12: rowData.ms_12,
                temp_12: rowData.temp_12,
                tc: rowData.tc,
                community_cert: rowData.community_cert,
                photo_2_copy: rowData.photo_2_copy,
                aadhaar: rowData.aadhaar,
                equivalency_cert: rowData.equivalency_cert,
                migration_cert: rowData.migration_cert,
                ms_iti: rowData.ms_iti,
                iti_prov: rowData.iti_prov,
                iti_cert_add: rowData.iti_cert_add,
                remarks: rowData.remarks
            };

            const res = await apiService.post('/admissions/certificates-npc/save', payload);

            if (res.data.success) {
                toast.success('Record updated successfully');

                setEditedRows(prev => {
                    const newRows = { ...prev };
                    if (newRows[student_id]) {
                        newRows[student_id].isDirty = false;
                        if (res.data.result?.id) {
                            newRows[student_id].cert_id = res.data.result.id;
                        }
                    }
                    return newRows;
                });

                setRecords(prev => prev.map(r => r.student_id === student_id ? { ...r, ...rowData, cert_id: res.data.result?.id || rowData.cert_id } : r));
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.message || 'Failed to save record');
        }
    };

    const handleDelete = (cert_id, student_id) => {
        if (!cert_id) return;

        confirmAction("Are you sure you want to delete this certificate record?", async () => {
            try {
                const res = await apiService.delete(`/admissions/certificates-npc/${cert_id}`);
                if (res.data.success) {
                    toast.success('Certificate record deleted successfully');

                    const emptyCertData = {
                        cert_id: null,
                        ms_10: null, temp_10: null, ms_11: null, ms_12: null, temp_12: null, tc: null, community_cert: null, photo_2_copy: null, aadhaar: null,
                        equivalency_cert: null, migration_cert: null, ms_iti: null, iti_prov: null, iti_cert_add: null, remarks: null,
                        isDirty: false
                    };

                    setRecords(prev => prev.map(r => r.student_id === student_id ? { ...r, ...emptyCertData } : r));

                    setEditedRows(prev => {
                        const newRows = { ...prev };
                        delete newRows[student_id];
                        return newRows;
                    });
                }
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(error.response?.data?.message || 'Failed to delete record');
            }
        });
    };

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const SelectField = ({ value, onChange }) => (
        <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '70px', background: '#fff' }}
        >
            <option value="">-</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
        </select>
    );

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{ color: "var(--primary-color)", margin: 0 }}>Certificate Management - NPC (I Year & II Year - LE)</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={handleExcelExport} className={styles.exportBtn} style={{ background: '#10b981', color: '#fff', border: 'none' }}>
                            <Download size={18} /> Export Excel
                        </button>
                        <button onClick={fetchData} className={styles.exportBtn} style={{ background: 'var(--primary-color)', color: '#fff', border: 'none' }}>
                            <RefreshCw size={18} /> Refresh
                        </button>
                    </div>
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Year <span style={{color:'red'}}>*</span></label>
                        <select
                            className={styles.selectInput}
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            style={{ borderColor: !yearFilter ? 'red' : '#e5e7eb' }}
                        >
                            <option value="">Select Year</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Global Search</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search by name, app no..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search size={16} style={{ position: 'absolute', right: 10, top: 10, color: '#9ca3af' }} />
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>College</label>
                        <select
                            className={styles.selectInput}
                            value={collegeFilter}
                            onChange={(e) => setCollegeFilter(e.target.value)}
                        >
                            <option value="">All Colleges</option>
                            {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Department</label>
                        <select
                            className={styles.selectInput}
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {records
                                .filter(r => !collegeFilter || r.college === collegeFilter)
                                .map(r => (r.programme && r.programme.trim()) ? `${r.programme} - ${r.department}` : (r.department || ''))
                                .filter(Boolean)
                                .filter((v, i, a) => a.indexOf(v) === i)
                                .sort()
                                .map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Quota</label>
                        <select
                            className={styles.selectInput}
                            value={quotaFilter}
                            onChange={(e) => setQuotaFilter(e.target.value)}
                        >
                            <option value="">All Quotas</option>
                            {quotas.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status</label>
                        <select
                            className={styles.selectInput}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className={styles.resetRow} style={{ marginBottom: '1rem' }}>
                    <button onClick={handleResetFilters} className={styles.resetFiltersBtn}>
                        Reset All Filters
                    </button>
                </div>

                {!yearFilter ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        Please select an Admission Year to view the certificate entry records.
                    </div>
                ) : (
                    <>
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
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={150}>150</option>
                                </select>
                                <label>entries</label>
                            </div>
                        </div>

                        <div className={styles.tableContainer} style={{ overflowX: 'auto', minHeight: '300px' }}>
                            {loading ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>Loading records...</div>
                            ) : (
                                <table className={styles.table} style={{ whiteSpace: 'nowrap' }}>
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f9fafb' }}>
                                        <tr>
                                            <th>S.No</th>
                                             <th>App No</th>
                                             <th>Name</th>
                                             <th>DOB</th>
                                             <th>Status</th>
                                             <th>Coll</th>
                                             <th>Dept</th>
                                             <th>Year</th>
                                             <th>Quota</th>
                                             <th>Community</th>
                                             <th>10th MC</th>
                                            {showIYearOnlyFields && <th>10th Temp</th>}
                                            {showNonIYearFields && <th>11th MC</th>}
                                            {showNonIYearFields && <th>12th MC</th>}
                                            {showNonIYearFields && <th>12th Temp</th>}
                                            <th>TC</th>
                                            <th>Community Cert</th>
                                            <th>Photo (2 Copy)</th>
                                            <th>Aadhaar</th>
                                            <th>Equivalency Cert</th>
                                            {showNonIYearFields && <th>Migration Cert</th>}
                                            {showNonIYearFields && <th>MS ITI</th>}
                                            {showNonIYearFields && <th>ITI Prov</th>}
                                            {showNonIYearFields && <th>ITI Cert Add</th>}
                                            <th>Remarks</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRecords.length > 0 ? (
                                            currentRecords.map((record, index) => {
                                                const rowData = editedRows[record.student_id] || record;
                                                const isDirty = rowData.isDirty;
                                                const certId = rowData.cert_id;
                                                
                                                const rowShowNonIYear = record.admission_year !== 'I Year';

                                                const npcFields = ['ms_10', 'tc', 'community_cert', 'photo_2_copy', 'aadhaar', 'equivalency_cert'];
                                                if (record.admission_year === 'I Year') {
                                                    npcFields.push('temp_10');
                                                }
                                                if (record.admission_year !== 'I Year') {
                                                    npcFields.push('ms_11', 'ms_12', 'temp_12', 'migration_cert', 'ms_iti', 'iti_prov', 'iti_cert_add');
                                                }
                                                const isAllYes = npcFields.every(f => rowData[f] === 'Yes');

                                                return (
                                                    <tr key={record.student_id} style={{ backgroundColor: isDirty ? '#fef9c3' : (isAllYes ? '#dcfce7' : 'transparent'), transition: 'background-color 0.3s' }}>
                                                         <td>{indexOfFirstRecord + index + 1}</td>
                                                         <td><strong>{record.application_no}</strong></td>
                                                         <td>{record.student_name}</td>
                                                         <td>{record.dob ? new Date(record.dob).toLocaleDateString('en-GB') : '-'}</td>
                                                         <td>{record.student_status}</td>
                                                         <td>{record.college}</td>
                                                         <td>{(record.programme && record.programme.trim()) ? `${record.programme} - ${record.department}` : record.department}</td>
                                                         <td>{record.admission_year}</td>
                                                         <td>{record.quota}</td>
                                                         <td>{record.community}</td>
                                                         <td><SelectField value={rowData.ms_10} onChange={(val) => handleInputChange(record.student_id, 'ms_10', val)} /></td>
                                                        {showIYearOnlyFields && <td><SelectField value={rowData.temp_10} onChange={(val) => handleInputChange(record.student_id, 'temp_10', val)} /></td>}
                                                        
                                                        {showNonIYearFields && <td>{rowShowNonIYear ? <SelectField value={rowData.ms_11} onChange={(val) => handleInputChange(record.student_id, 'ms_11', val)} /> : '-'}</td>}
                                                        {showNonIYearFields && <td>{rowShowNonIYear ? <SelectField value={rowData.ms_12} onChange={(val) => handleInputChange(record.student_id, 'ms_12', val)} /> : '-'}</td>}
                                                        {showNonIYearFields && <td>{rowShowNonIYear ? <SelectField value={rowData.temp_12} onChange={(val) => handleInputChange(record.student_id, 'temp_12', val)} /> : '-'}</td>}
                                                        
                                                        <td><SelectField value={rowData.tc} onChange={(val) => handleInputChange(record.student_id, 'tc', val)} /></td>
                                                        <td><SelectField value={rowData.community_cert} onChange={(val) => handleInputChange(record.student_id, 'community_cert', val)} /></td>
                                                        <td><SelectField value={rowData.photo_2_copy} onChange={(val) => handleInputChange(record.student_id, 'photo_2_copy', val)} /></td>
                                                        <td><SelectField value={rowData.aadhaar} onChange={(val) => handleInputChange(record.student_id, 'aadhaar', val)} /></td>
                                                        <td><SelectField value={rowData.equivalency_cert} onChange={(val) => handleInputChange(record.student_id, 'equivalency_cert', val)} /></td>
                                                        
                                                        {showNonIYearFields && <td>{rowShowNonIYear ? <SelectField value={rowData.migration_cert} onChange={(val) => handleInputChange(record.student_id, 'migration_cert', val)} /> : '-'}</td>}
                                                        {showNonIYearFields && <td>{rowShowNonIYear ? <SelectField value={rowData.ms_iti} onChange={(val) => handleInputChange(record.student_id, 'ms_iti', val)} /> : '-'}</td>}
                                                        {showNonIYearFields && <td>{rowShowNonIYear ? <SelectField value={rowData.iti_prov} onChange={(val) => handleInputChange(record.student_id, 'iti_prov', val)} /> : '-'}</td>}
                                                        {showNonIYearFields && <td>{rowShowNonIYear ? <SelectField value={rowData.iti_cert_add} onChange={(val) => handleInputChange(record.student_id, 'iti_cert_add', val)} /> : '-'}</td>}

                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={rowData.remarks || ''}
                                                                onChange={e => handleInputChange(record.student_id, 'remarks', e.target.value)}
                                                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
                                                                placeholder="Remarks..."
                                                            />
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button
                                                                    className={styles.editBtn}
                                                                    style={{ background: isDirty ? '#10b981' : '#3b82f6', opacity: isDirty ? 1 : 0.6, cursor: isDirty ? 'pointer' : 'default' }}
                                                                    onClick={() => handleSave(record.student_id)}
                                                                    title={certId && !isDirty ? 'Saved' : 'Update Record'}
                                                                    disabled={!isDirty}
                                                                >
                                                                    <Save size={16} />
                                                                </button>
                                                                {certId && (
                                                                    <button
                                                                        className={styles.deleteBtn}
                                                                        onClick={() => handleDelete(certId, record.student_id)}
                                                                        title="Delete Record"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="40" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {filteredRecords.length > 0 && !loading && (
                            <div className={styles.pagination}>
                                <div className={styles.paginationInfo}>
                                    Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} entries
                                </div>
                                <div className={styles.paginationControls}>
                                    <button
                                        className={styles.pageBtn}
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(number => number === 1 || number === totalPages || (number >= currentPage - 2 && number <= currentPage + 2))
                                        .map((number, index, array) => (
                                            <React.Fragment key={number}>
                                                {index > 0 && array[index - 1] !== number - 1 && <span style={{ margin: '0 5px' }}>...</span>}
                                                <button
                                                    className={`${styles.pageBtn} ${currentPage === number ? styles.activePage : ''}`}
                                                    onClick={() => paginate(number)}
                                                >
                                                    {number}
                                                </button>
                                            </React.Fragment>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default CertificateEntryNPC;
