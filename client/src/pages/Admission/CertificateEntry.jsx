import React, { useState, useEffect } from 'react';
import { Search, Save, Trash2, RefreshCw, Award, Download } from 'lucide-react';
import styles from '../../components/css/Dashboard.module.css';
import reportStyles from '../../components/css/RecordReport.module.css';
import toast from 'react-hot-toast';
import { confirmAction } from '../../components/layout/Toast';
import apiService from '../../services/api.service';

const CertificateEntry = () => {
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
            const res = await apiService.get('/admissions/certificates/list');
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

    // Excel Export
    const handleExcelExport = () => {
        if (filteredRecords.length === 0) { toast.error('No records to export'); return; }
        const headers = ['S.No', 'App No', 'Name', 'DOB', 'Status', 'College', 'Programme', 'Department', 'Year', 'Quota', 'Community',
            '10th MC', '11th MC', '12th MC', '12th Temp', 'Allotment Order',
            'Dip Sem 1', 'Dip Sem 2', 'Dip Sem 3', 'Dip Sem 4', 'Dip Sem 5', 'Dip Sem 6', 'Dip Cons', 'Dip Cert', 'Dip Prov',
            'TC', 'Comm Cert', 'FGC', 'IC', 'NC', 'BC', 'JD', 'Remarks'];
        const rows = filteredRecords.map((r, i) => [
            i + 1, r.application_no, r.student_name, r.dob ? new Date(r.dob).toLocaleDateString('en-GB') : '', r.student_status, r.college, r.programme, r.department, r.admission_year || '', r.quota || '', r.community || '',
            r.tenth_marksheet || '', r.eleventh_marksheet || '', r.twelfth_marksheet || '', r.twelfth_temp || '', r.allotment_order || '',
            r.dip_sem_1 || '', r.dip_sem_2 || '', r.dip_sem_3 || '', r.dip_sem_4 || '', r.dip_sem_5 || '', r.dip_sem_6 || '', r.dip_cons || '', r.dip_cert || '', r.dip_prov || '',
            r.transfer_certificate || '', r.community_certificate || '', r.first_graduate_certificate || '',
            r.income_certificate || '', r.native_certificate || '', r.bonafide_certificate || '',
            r.JD_certificate || '', r.remarks || ''
        ]);
        const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'certificate_management.csv'; a.click();
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
                tenth_marksheet: rowData.tenth_marksheet,
                eleventh_marksheet: rowData.eleventh_marksheet,
                twelfth_marksheet: rowData.twelfth_marksheet,
                twelfth_temp: rowData.twelfth_temp,
                transfer_certificate: rowData.transfer_certificate,
                community_certificate: rowData.community_certificate,
                first_graduate_certificate: rowData.first_graduate_certificate,
                income_certificate: rowData.income_certificate,
                native_certificate: rowData.native_certificate,
                bonafide_certificate: rowData.bonafide_certificate,
                JD_certificate: rowData.JD_certificate,
                allotment_order: rowData.allotment_order,
                dip_sem_1: rowData.dip_sem_1,
                dip_sem_2: rowData.dip_sem_2,
                dip_sem_3: rowData.dip_sem_3,
                dip_sem_4: rowData.dip_sem_4,
                dip_sem_5: rowData.dip_sem_5,
                dip_sem_6: rowData.dip_sem_6,
                dip_cons: rowData.dip_cons,
                dip_cert: rowData.dip_cert,
                dip_prov: rowData.dip_prov,
                remarks: rowData.remarks
            };

            const res = await apiService.post('/admissions/certificates/save', payload);

            if (res.data.success) {
                toast.success('Record updated successfully');

                // Clear dirty state and maybe set cert_id if newly inserted
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

                // Update main records
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
                const res = await apiService.delete(`/admissions/certificates/${cert_id}`);
                if (res.data.success) {
                    toast.success('Certificate record deleted successfully');

                    // Update state
                    const emptyCertData = {
                        cert_id: null,
                        tenth_marksheet: null, eleventh_marksheet: null, twelfth_marksheet: null, twelfth_temp: null,
                        transfer_certificate: null, community_certificate: null, first_graduate_certificate: null,
                        income_certificate: null, native_certificate: null, bonafide_certificate: null, JD_certificate: null,
                        allotment_order: null, dip_sem_1: null, dip_sem_2: null, dip_sem_3: null, dip_sem_4: null, dip_sem_5: null, dip_sem_6: null, dip_cons: null, dip_cert: null, dip_prov: null,
                        remarks: null,
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

    const showIYearFields = yearFilter === 'I Year';
    const showIIYearFields = yearFilter === 'II Year - LE';

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{ color: "var(--primary-color)", margin: 0 }}>Certificate Management - UG</h2>
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
                        <label className={styles.filterLabel}>Year <span style={{ color: 'red' }}>*</span></label>
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
                                            <th>11th MC</th>
                                            <th>12th MC</th>
                                            {showIYearFields && <th>12th Temp</th>}
                                            {showIIYearFields && <th>Allot Order</th>}
                                            {showIIYearFields && <th>Dip Sem 1</th>}
                                            {showIIYearFields && <th>Dip Sem 2</th>}
                                            {showIIYearFields && <th>Dip Sem 3</th>}
                                            {showIIYearFields && <th>Dip Sem 4</th>}
                                            {showIIYearFields && <th>Dip Sem 5</th>}
                                            {showIIYearFields && <th>Dip Sem 6</th>}
                                            {showIIYearFields && <th>Dip Cons</th>}
                                            {showIIYearFields && <th>Dip Cert</th>}
                                            {showIIYearFields && <th>Dip Prov</th>}
                                            <th>TC</th>
                                            <th>Comm</th>
                                            <th>FGC</th>
                                            <th>INC</th>
                                            <th>NAC</th>
                                            {showIYearFields && <th>BC</th>}
                                            <th>JD</th>
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

                                                const rowShowIYear = record.admission_year === 'I Year';
                                                const rowShowIIYear = record.admission_year === 'II Year - LE';

                                                let certFields = [];
                                                if (rowShowIYear && record.quota === 'MANAGEMENT') {
                                                    certFields = [
                                                        'tenth_marksheet', 'eleventh_marksheet', 'twelfth_marksheet', 'twelfth_temp',
                                                        'transfer_certificate', 'income_certificate'
                                                    ];
                                                } else if (rowShowIYear) {
                                                    certFields = [
                                                        'tenth_marksheet', 'eleventh_marksheet', 'twelfth_marksheet', 'twelfth_temp',
                                                        'transfer_certificate', 'community_certificate', 'first_graduate_certificate',
                                                        'income_certificate', 'native_certificate', 'bonafide_certificate', 'JD_certificate'
                                                    ];
                                                } else if (rowShowIIYear) {
                                                    certFields = [
                                                        'tenth_marksheet', 'eleventh_marksheet', 'twelfth_marksheet',
                                                        'transfer_certificate', 'community_certificate', 'first_graduate_certificate',
                                                        'income_certificate', 'native_certificate', 'JD_certificate',
                                                        'allotment_order', 'dip_sem_1', 'dip_sem_2', 'dip_sem_3', 'dip_sem_4', 'dip_sem_5',
                                                        'dip_sem_6', 'dip_cons', 'dip_cert', 'dip_prov'
                                                    ];
                                                } else {
                                                    certFields = ['tenth_marksheet', 'eleventh_marksheet', 'twelfth_marksheet', 'transfer_certificate'];
                                                }

                                                const isAllYes = certFields.every(f => rowData[f] === 'Yes');
                                                const hasNullOrEmpty = certFields.some(f => !rowData[f] || rowData[f] === '');

                                                const bgColor = isDirty ? '#fef9c3' : (isAllYes ? '#dcfce7' : '#fee2e2');

                                                return (
                                                    <tr key={record.student_id} style={{ backgroundColor: bgColor, transition: 'background-color 0.3s' }}>
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
                                                        <td><SelectField value={rowData.tenth_marksheet} onChange={(val) => handleInputChange(record.student_id, 'tenth_marksheet', val)} /></td>
                                                        <td><SelectField value={rowData.eleventh_marksheet} onChange={(val) => handleInputChange(record.student_id, 'eleventh_marksheet', val)} /></td>
                                                        <td><SelectField value={rowData.twelfth_marksheet} onChange={(val) => handleInputChange(record.student_id, 'twelfth_marksheet', val)} /></td>
                                                        {showIYearFields && <td>{rowShowIYear ? <SelectField value={rowData.twelfth_temp} onChange={(val) => handleInputChange(record.student_id, 'twelfth_temp', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.allotment_order} onChange={(val) => handleInputChange(record.student_id, 'allotment_order', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.dip_sem_1} onChange={(val) => handleInputChange(record.student_id, 'dip_sem_1', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.dip_sem_2} onChange={(val) => handleInputChange(record.student_id, 'dip_sem_2', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.dip_sem_3} onChange={(val) => handleInputChange(record.student_id, 'dip_sem_3', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.dip_sem_4} onChange={(val) => handleInputChange(record.student_id, 'dip_sem_4', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.dip_sem_5} onChange={(val) => handleInputChange(record.student_id, 'dip_sem_5', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.dip_sem_6} onChange={(val) => handleInputChange(record.student_id, 'dip_sem_6', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.dip_cons} onChange={(val) => handleInputChange(record.student_id, 'dip_cons', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.dip_cert} onChange={(val) => handleInputChange(record.student_id, 'dip_cert', val)} /> : '-'}</td>}
                                                        {showIIYearFields && <td>{rowShowIIYear ? <SelectField value={rowData.dip_prov} onChange={(val) => handleInputChange(record.student_id, 'dip_prov', val)} /> : '-'}</td>}
                                                        <td><SelectField value={rowData.transfer_certificate} onChange={(val) => handleInputChange(record.student_id, 'transfer_certificate', val)} /></td>
                                                        <td><SelectField value={rowData.community_certificate} onChange={(val) => handleInputChange(record.student_id, 'community_certificate', val)} /></td>
                                                        <td><SelectField value={rowData.first_graduate_certificate} onChange={(val) => handleInputChange(record.student_id, 'first_graduate_certificate', val)} /></td>
                                                        <td><SelectField value={rowData.income_certificate} onChange={(val) => handleInputChange(record.student_id, 'income_certificate', val)} /></td>
                                                        <td><SelectField value={rowData.native_certificate} onChange={(val) => handleInputChange(record.student_id, 'native_certificate', val)} /></td>
                                                        {showIYearFields && <td>{rowShowIYear ? <SelectField value={rowData.bonafide_certificate} onChange={(val) => handleInputChange(record.student_id, 'bonafide_certificate', val)} /> : '-'}</td>}
                                                        <td><SelectField value={rowData.JD_certificate} onChange={(val) => handleInputChange(record.student_id, 'JD_certificate', val)} /></td>
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
                                                <td colSpan="34" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

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
            </div>
        </div>
    );
};

export default CertificateEntry;
