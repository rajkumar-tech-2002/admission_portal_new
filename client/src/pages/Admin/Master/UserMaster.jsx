import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Settings, User } from 'lucide-react';
import apiService from '../../../services/api.service';
import toast from 'react-hot-toast';
import { confirmAction } from '../../../components/layout/Toast';
import styles from '../../../components/css/MasterManagement.module.css';

const UserMaster = () => {
    const [data, setData] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ user_id: '', user_role: '', password: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, masterRes] = await Promise.all([
                apiService.get('/users'),
                apiService.get('/master')
            ]);
            
            if (usersRes.data.success) {
                setData(usersRes.data.data);
            }
            if (masterRes.data.success && masterRes.data.data.roles) {
                setRoles(masterRes.data.data.roles);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData({ user_id: item.user_id, user_role: item.user_role, password: '' });
        } else {
            setFormData({ user_id: '', user_role: '', password: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ user_id: '', user_role: '', password: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingItem) {
                const response = await apiService.put(`/users/${editingItem.id}`, formData);
                if (response.data.success) {
                    toast.success('User updated successfully');
                    fetchData();
                    handleCloseModal();
                }
            } else {
                if (!formData.password) {
                    toast.error('Password is required for new users');
                    return;
                }
                const response = await apiService.post('/users', formData);
                if (response.data.success) {
                    toast.success('User added successfully');
                    fetchData();
                    handleCloseModal();
                }
            }
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error(error.response?.data?.message || 'Failed to save user');
        }
    };

    const handleDelete = (id) => {
        confirmAction('Are you sure you want to delete this user?', async () => {
            try {
                const response = await apiService.delete(`/users/${id}`);
                if (response.data.success) {
                    toast.success('User deleted successfully');
                    fetchData();
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('Failed to delete user');
            }
        });
    };

    const filteredData = data.filter(item => 
        (item.user_id && item.user_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.user_role && item.user_role.toLowerCase().includes(searchTerm.toLowerCase()))
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
                    <User size={24} color="var(--primary-color)" />
                    <h2>User Master</h2>
                </div>
                <button className={styles.addBtn} onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add New User
                </button>
            </div>

            <div className={styles.filterSection}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
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
                    <div className={styles.loader}>Loading users...</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>User ID</th>
                                <th>Role</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRecords.length > 0 ? (
                                currentRecords.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{indexOfFirstRecord + index + 1}</td>
                                        <td><strong>{item.user_id}</strong></td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '30px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                backgroundColor: item.user_role === 'ADMIN' ? '#d1fae5' : '#fef3c7',
                                                color: item.user_role === 'ADMIN' ? '#065f46' : '#92400e'
                                            }}>
                                                {item.user_role}
                                            </span>
                                        </td>
                                        <td>{new Date(item.created_at).toLocaleString()}</td>
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
                                    <td colSpan="5" className={styles.noData}>No users found</td>
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
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{editingItem ? 'Edit User' : 'Add New User'}</h3>
                            <button className={styles.closeBtn} onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Role <span style={{color: 'red'}}>*</span></label>
                                <select 
                                    name="user_role" 
                                    value={formData.user_role} 
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.role_name}>{role.role_name}</option>
                                    ))}
                                    {/* Fallback in case roles are not fetched properly */}
                                    {roles.length === 0 && (
                                        <>
                                            <option value="ADMIN">ADMIN</option>
                                            <option value="ENQUIRY TEAM">ENQUIRY TEAM</option>
                                            <option value="ADMISSION TEAM">ADMISSION TEAM</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>User ID <span style={{color: 'red'}}>*</span></label>
                                <input 
                                    type="text" 
                                    name="user_id"
                                    value={formData.user_id}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Password {editingItem ? '(Leave blank to keep unchanged)' : <span style={{color: 'red'}}>*</span>}
                                </label>
                                <input 
                                    type="password" 
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder={editingItem ? "Enter new password" : "Enter password"}
                                    required={!editingItem}
                                />
                            </div>
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

export default UserMaster;
