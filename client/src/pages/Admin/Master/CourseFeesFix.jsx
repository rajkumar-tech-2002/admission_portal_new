import React, { useState, useEffect, useMemo } from 'react';
import { Save, Trash2, Plus, RefreshCw, IndianRupee, Edit2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmAction } from '../../../components/layout/Toast';
import apiService from '../../../services/api.service';
import styles from '../../../components/css/MasterManagement.module.css';

const mapQuotaForDisplay = (quotaValue) => {
    if (quotaValue === 'COUNSELLING') return 'Government Quota';
    if (quotaValue === 'MANAGEMENT') return 'Management Quota';
    return quotaValue || '';
};

const mapQuotaForSave = (quotaValue) => {
    if (quotaValue === 'Government Quota') return 'COUNSELLING';
    if (quotaValue === 'Management Quota') return 'MANAGEMENT';
    return quotaValue || '';
};

const CourseFeesFix = () => {
    const [records, setRecords] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [admissionTypes, setAdmissionTypes] = useState([]);
    const [admissionYears, setAdmissionYears] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        id: '',
        institution: '',
        type: '',
        programme: '',
        department: '',
        year: '',
        intake: '',
        quota: '',
        fees: ''
    });

    const fetchMasterData = async () => {
        setLoading(true);
        try {
            const res = await apiService.get('/master');
            if (res.data.success) {
                const data = res.data.data;
                setRecords(data.courseFeeStructure || []);
                setDepartments(data.departments || []);
                setAdmissionTypes(data.admissionTypes || []);
                setAdmissionYears(data.admissionYears || []);
            }
        } catch (error) {
            console.error('Error fetching master data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    const handleDepartmentChange = (e) => {
        const val = e.target.value; // Expected format: "PROGRAM - DEPT"
        if (!val) {
            setFormData(prev => ({ ...prev, programme: '', department: '', institution: '', type: '' }));
            return;
        }
        
        // Find matching department in master
        const [prog, dept] = val.split(' - ');
        
        const matchedDept = departments.find(d => (d.program || '') === prog && d.department === dept);
        
        if (matchedDept) {
            setFormData(prev => ({
                ...prev,
                programme: matchedDept.program || '',
                department: matchedDept.department,
                institution: matchedDept.institution || '',
                type: matchedDept.type || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, programme: prog, department: dept }));
        }
    };

    const handleOpenModal = (record = null) => {
        if (record) {
            setFormData({
                id: record.id,
                institution: record.institution || '',
                type: record.type || '',
                programme: record.programme || '',
                department: record.department || '',
                year: record.year || '',
                intake: record.intake || '',
                quota: record.quota || '',
                fees: record.fees || ''
            });
        } else {
            setFormData({
                id: '',
                institution: '',
                type: '',
                programme: '',
                department: '',
                year: '',
                intake: '',
                quota: '',
                fees: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        confirmAction('Are you sure you want to delete this course fee record?', async () => {
            try {
                const res = await apiService.delete(`/master/course_fee_structure/${id}`);
                if (res.data.success) {
                    toast.success('Record deleted successfully');
                    fetchMasterData();
                }
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('Failed to delete record');
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        try {
            if (formData.id) {
                // Update
                const { id, ...payload } = formData;
                const res = await apiService.put(`/master/course_fee_structure/${id}`, payload);
                if (res.data.success) {
                    toast.success('Course fee structure updated');
                    setIsModalOpen(false);
                    fetchMasterData();
                }
            } else {
                // Insert
                const { id, ...payload } = formData;
                const res = await apiService.post('/master/course_fee_structure', payload);
                if (res.data.success) {
                    toast.success('Course fee structure added');
                    setIsModalOpen(false);
                    fetchMasterData();
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.message || 'Failed to save record');
        }
    };

    // Filter Logic
    const filteredRecords = useMemo(() => {
        return records.filter(item => 
            Object.values(item).some(val => 
                String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [records, searchTerm]);

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IndianRupee size={24} color="var(--primary-color)" />
                    <h2>Course Fees Fix</h2>
                </div>
                <button className={styles.addBtn} onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add New
                </button>
            </div>

            <div className={styles.filterSection}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

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
                        <option value={100}>100</option>
                        <option value={150}>150</option>
                        <option value={200}>200</option>
                        <option value={250}>250</option>
                    </select>
                    <label>entries</label>
                </div>
            </div>

            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loader}>Loading...</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Institution</th>
                                <th>Type</th>
                                <th>Programme</th>
                                <th>Department</th>
                                <th>Year</th>
                                <th>Quota</th>
                                <th>Intake</th>
                                <th>Fees (₹)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRecords.length > 0 ? (
                                currentRecords.map((record, index) => (
                                    <tr key={record.id}>
                                        <td>{indexOfFirstRecord + index + 1}</td>
                                        <td>{record.institution}</td>
                                        <td>{record.type}</td>
                                        <td>{record.programme || '-'}</td>
                                        <td>{record.department}</td>
                                        <td>{record.year}</td>
                                        <td>{record.quota}</td>
                                        <td>{record.intake}</td>
                                        <td style={{ fontWeight: 'bold', color: '#059669' }}>
                                            {parseFloat(record.fees || 0).toLocaleString()}
                                        </td>
                                        <td className={styles.actions}>
                                            <button 
                                                onClick={() => handleOpenModal(record)} 
                                                className={styles.editBtn}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(record.id)} 
                                                className={styles.deleteBtn}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className={styles.noData}>No data found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && filteredRecords.length > 0 && (
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                            <button
                                key={number}
                                className={`${styles.pageBtn} ${currentPage === number ? styles.activePage : ''}`}
                                onClick={() => paginate(number)}
                            >
                                {number}
                            </button>
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

            {/* Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} ${styles.largeModal}`}>
                        <div className={styles.modalHeader}>
                            <h3>{formData.id ? 'Edit Course Fee Structure' : 'Add Course Fee Structure'}</h3>
                            <button className={styles.closeBtn} onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className={`${styles.modalForm} ${styles.modalFormGrid}`}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Department (Prog - Dept) *</label>
                                <select 
                                    className={styles.input}
                                    value={formData.department ? `${formData.programme || ''} - ${formData.department}` : ''}
                                    onChange={handleDepartmentChange}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((d, idx) => (
                                        <option key={idx} value={`${d.program || ''} - ${d.department}`}>
                                            {d.program ? `${d.program} - ${d.department}` : d.department}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Institution</label>
                                <input 
                                    type="text" 
                                    className={styles.input}
                                    value={formData.institution}
                                    readOnly
                                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Type</label>
                                <input 
                                    type="text" 
                                    className={styles.input}
                                    value={formData.type}
                                    readOnly
                                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Admission Year *</label>
                                <select 
                                    className={styles.input}
                                    value={formData.year}
                                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {admissionYears.map(y => (
                                        <option key={y.id} value={y.admission_year_name}>{y.admission_year_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Quota *</label>
                                <select 
                                    className={styles.input}
                                    value={mapQuotaForDisplay(formData.quota)}
                                    onChange={(e) => setFormData(prev => ({ ...prev, quota: mapQuotaForSave(e.target.value) }))}
                                    required
                                >
                                    <option value="">Select Quota</option>
                                    {admissionTypes.map(q => (
                                        <option key={q.id} value={q.admission_type}>{q.admission_type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Intake *</label>
                                <input 
                                    type="number" 
                                    className={styles.input}
                                    value={formData.intake}
                                    onChange={(e) => setFormData(prev => ({ ...prev, intake: e.target.value }))}
                                    required
                                    min="0"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Total Fees *</label>
                                <input 
                                    type="number" 
                                    className={styles.input}
                                    value={formData.fees}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fees: e.target.value }))}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}>
                                    {formData.id ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseFeesFix;
