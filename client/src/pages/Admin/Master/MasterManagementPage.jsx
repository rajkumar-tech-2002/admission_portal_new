import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Settings } from 'lucide-react';
import apiService from '../../../services/api.service';
import toast from 'react-hot-toast';
import { confirmAction } from '../../../components/layout/Toast';
import styles from '../../../components/css/MasterManagement.module.css';

const MasterManagementPage = ({ title, tableType, columns, fields }) => {
    const [data, setData] = useState([]);
    const [allMasterData, setAllMasterData] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    const isSingleton = tableType === 'valid-date';

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiService.get('/master');
            if (response.data.success) {
                setAllMasterData(response.data.data);
                // Map tableType to master data key
                const keyMapping = {
                    'departments': 'departments',
                    'studies': 'studies',
                    'communities': 'communities',
                    'admission-types': 'admissionTypes',
                    'reference-types': 'referenceTypes',
                    'admission-statuses': 'admissionStatuses',
                    'valid-date': 'validDate',
                    'districts': 'districts',
                    'schools': 'schools',
                    'consultancies': 'consultancies',
                    'staff': 'staff',
                    'annual-income': 'annualIncome',
                    'religions': 'religions',
                    'school-types': 'schoolTypes',
                    'admission-years': 'admissionYears',
                    'groups-12th': 'groups12th',
                    'roles': 'roles'
                };
                
                const masterKey = keyMapping[tableType];
                const rawData = response.data.data[masterKey];
                
                // If it's valid-date, it might be a single object
                setData(Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []));
            }
        } catch (error) {
            console.error(`Error fetching ${title}:`, error);
            toast.error(`Failed to load ${title}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tableType]);

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            // For checkbox groups, convert comma string to array
            const initializedData = { ...item };
            fields.forEach(f => {
                if (f.type === 'checkbox-group' && typeof item[f.name] === 'string') {
                    initializedData[f.name] = item[f.name].split(',').filter(s => s);
                }
            });
            setFormData(initializedData);
        } else {
            const initialData = {};
            fields.forEach(f => {
                if (f.type === 'checkbox-group') initialData[f.name] = [];
                else initialData[f.name] = '';
            });
            setFormData(initialData);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCheckboxChange = (fieldName, option, checked) => {
        const currentValues = formData[fieldName] || [];
        if (checked) {
            setFormData({ ...formData, [fieldName]: [...currentValues, option] });
        } else {
            setFormData({ ...formData, [fieldName]: currentValues.filter(v => v !== option) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prepare data for API (only send fields that exist in the form configuration)
        const submissionData = {};
        fields.forEach(field => {
            let value = formData[field.name];
            // If it's a checkbox group (array), join it with commas
            if (Array.isArray(value)) {
                value = value.join(',');
            }
            submissionData[field.name] = value;
        });

        try {
            if (editingItem) {
                const response = await apiService.put(`/master/${tableType}/${editingItem.id}`, submissionData);
                if (response.data.success) {
                    toast.success(`${title} updated successfully`);
                    fetchData();
                    handleCloseModal();
                }
            } else {
                const response = await apiService.post(`/master/${tableType}`, submissionData);
                if (response.data.success) {
                    toast.success(`${title} added successfully`);
                    fetchData();
                    handleCloseModal();
                }
            }
        } catch (error) {
            console.error(`Error saving ${title}:`, error);
            toast.error(error.response?.data?.message || `Failed to save ${title}`);
        }
    };

    const handleDelete = (id) => {
        confirmAction(`Are you sure you want to delete this ${title}?`, async () => {
            try {
                const response = await apiService.delete(`/master/${tableType}/${id}`);
                if (response.data.success) {
                    toast.success(`${title} deleted successfully`);
                    fetchData();
                }
            } catch (error) {
                console.error(`Error deleting ${title}:`, error);
                toast.error(`Failed to delete ${title}`);
            }
        });
    };

    const filteredData = data.filter(item => 
        Object.values(item).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredData.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={24} color="var(--primary-color)" />
                    <h2>{title}</h2>
                </div>
                {(!isSingleton || data.length === 0) && (
                    <button className={styles.addBtn} onClick={() => handleOpenModal()}>
                        <Plus size={18} /> Add New
                    </button>
                )}
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
                                {columns.map(col => <th key={col.key}>{col.label}</th>)}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRecords.length > 0 ? (
                                currentRecords.map((item, index) => (
                                    <tr key={item.id || index}>
                                        <td>{indexOfFirstRecord + index + 1}</td>
                                        {columns.map(col => <td key={col.key}>{item[col.key]}</td>)}
                                        <td className={styles.actions}>
                                            <button className={styles.editBtn} onClick={() => handleOpenModal(item)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 2} className={styles.noData}>No data found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && filteredData.length > 0 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredData.length)} of {filteredData.length} entries
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
                    <div className={`${styles.modal} ${fields.length > 6 ? styles.largeModal : ''}`}>
                        <div className={styles.modalHeader}>
                            <h3>{editingItem ? `Edit ${title}` : `Add New ${title}`}</h3>
                            <button className={styles.closeBtn} onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={`${styles.modalForm} ${fields.length > 6 ? styles.modalFormGrid : ''}`}>
                            {fields.map(field => (
                                <div className={styles.formGroup} key={field.name}>
                                    <label className={styles.label}>{field.label}</label>
                                    {field.type === 'select' ? (
                                        <select 
                                            name={field.name} 
                                            value={formData[field.name] || ''} 
                                            onChange={handleInputChange}
                                            className={styles.input}
                                            required={field.required}
                                        >
                                            <option value="">Select {field.label}</option>
                                            {(() => {
                                                let options = field.options || [];
                                                if (field.optionsKey === 'institutions' && allMasterData.departments) {
                                                    options = [...new Set(allMasterData.departments.map(d => d.institution).filter(Boolean))];
                                                } else if (field.optionsKey === 'departments' && allMasterData.departments) {
                                                    const depList = field.dependsOn 
                                                        ? allMasterData.departments.filter(d => d.institution === formData[field.dependsOn])
                                                        : allMasterData.departments;
                                                    options = [...new Set(depList.map(d => d.department).filter(Boolean))];
                                                }
                                                return options.map(opt => <option key={opt} value={opt}>{opt}</option>);
                                            })()}
                                        </select>
                                    ) : field.type === 'checkbox-group' ? (
                                        <div className={styles.checkboxGroup}>
                                            {(field.options || allMasterData[field.optionsKey] || []).map(opt => {
                                                const label = typeof opt === 'string' ? opt : (opt.admission_status || opt.department || opt.study || opt.community);
                                                const value = typeof opt === 'string' ? opt : (opt.admission_status || opt.department || opt.study || opt.community);
                                                return (
                                                    <label key={value} className={styles.checkboxLabel}>
                                                        <input 
                                                            type="checkbox"
                                                            checked={(formData[field.name] || []).includes(value)}
                                                            onChange={(e) => handleCheckboxChange(field.name, value, e.target.checked)}
                                                        />
                                                        {label}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <input 
                                            type={field.type || 'text'} 
                                            name={field.name}
                                            value={formData[field.name] || ''}
                                            onChange={handleInputChange}
                                            className={styles.input}
                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                            required={field.required}
                                        />
                                    )}
                                </div>
                            ))}
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}>
                                    {editingItem ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterManagementPage;
