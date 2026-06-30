import React, { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import styles from '../../components/css/Dashboard.module.css';
import apiService from '../../services/api.service';

const StaffView = () => {
    // Staff data
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(100);

    // Filters
    const [search, setSearch] = useState('');
    const [institutionFilter, setInstitutionFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [staffTypeFilter, setStaffTypeFilter] = useState('');

    const [filteredRecords, setFilteredRecords] = useState([]);

    // Unique filter options derived from data
    const [institutions, setInstitutions] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [staffTypes, setStaffTypes] = useState([]);

    // Fetch staff data from master API
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                setLoading(true);
                const response = await apiService.get('/master');
                if (response.data.success) {
                    const staffData = response.data.data.staff || [];
                    setStaffList(staffData);

                    // Extract unique filter options
                    const uniqueInstitutions = [...new Set(staffData.map(s => s.staff_institution).filter(Boolean))].sort();
                    const uniqueDepartments = [...new Set(staffData.map(s => s.staff_department).filter(Boolean))].sort();
                    const uniqueTypes = [...new Set(staffData.map(s => s.staff_type).filter(Boolean))].sort();

                    setInstitutions(uniqueInstitutions);
                    setDepartments(uniqueDepartments);
                    setStaffTypes(uniqueTypes);
                }
            } catch (err) {
                console.error('Failed to load staff data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = staffList;

        // Apply Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(r =>
                (r.staff_name || '').toLowerCase().includes(lowerSearch) ||
                (r.staff_code || '').toLowerCase().includes(lowerSearch) ||
                (r.staff_institution || '').toLowerCase().includes(lowerSearch) ||
                (r.staff_department || '').toLowerCase().includes(lowerSearch) ||
                (r.staff_phone || '').toLowerCase().includes(lowerSearch) ||
                (r.staff_email || '').toLowerCase().includes(lowerSearch)
            );
        }

        // Apply Institution Filter
        if (institutionFilter) {
            result = result.filter(r => r.staff_institution === institutionFilter);
        }

        // Apply Department Filter
        if (departmentFilter) {
            result = result.filter(r => r.staff_department === departmentFilter);
        }

        // Apply Staff Type Filter
        if (staffTypeFilter) {
            result = result.filter(r => r.staff_type === staffTypeFilter);
        }

        setFilteredRecords(result);
        setCurrentPage(1);
    }, [staffList, search, institutionFilter, departmentFilter, staffTypeFilter]);

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleResetFilters = () => {
        setSearch('');
        setInstitutionFilter('');
        setDepartmentFilter('');
        setStaffTypeFilter('');
        setCurrentPage(1);
    };

    // Get filtered departments based on selected institution
    const getFilteredDepartments = () => {
        if (!institutionFilter) return departments;
        const depts = [...new Set(
            staffList
                .filter(s => s.staff_institution === institutionFilter)
                .map(s => s.staff_department)
                .filter(Boolean)
        )].sort();
        return depts;
    };

    return (
        <div className={styles.dashboard} style={{ padding: '0' }}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={22} style={{ color: 'var(--primary-color)' }} />
                        <h2 style={{ color: "var(--primary-color)", margin: 0 }}>Staff List</h2>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        Total Staff: <strong style={{ color: 'var(--primary-color)' }}>{filteredRecords.length}</strong>
                        {filteredRecords.length !== staffList.length && (
                            <span> / {staffList.length}</span>
                        )}
                    </div>
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Global Search</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search name, code, phone, email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search size={16} style={{ position: 'absolute', right: 10, top: 10, color: '#9ca3af' }} />
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Institution</label>
                        <select
                            className={styles.selectInput}
                            value={institutionFilter}
                            onChange={(e) => {
                                setInstitutionFilter(e.target.value);
                                setDepartmentFilter(''); // Reset department when institution changes
                            }}
                        >
                            <option value="">All Institutions</option>
                            {institutions.map(inst => (
                                <option key={inst} value={inst}>{inst}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Department</label>
                        <select
                            className={styles.selectInput}
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {getFilteredDepartments().map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Staff Type</label>
                        <select
                            className={styles.selectInput}
                            value={staffTypeFilter}
                            onChange={(e) => setStaffTypeFilter(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {staffTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.resetRow} style={{ marginBottom: '1rem' }}>
                    <button onClick={handleResetFilters} className={styles.resetFiltersBtn}>
                        Reset All Filters
                    </button>
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
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Staff Code</th>
                                <th>Staff Name</th>
                                <th>Institution</th>
                                <th>Department</th>
                                <th>Staff Type</th>
                                <th>Phone</th>
                                <th>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        Loading staff records...
                                    </td>
                                </tr>
                            ) : currentRecords.length > 0 ? (
                                currentRecords.map((staff, index) => (
                                    <tr key={staff.id}>
                                        <td>{indexOfFirstRecord + index + 1}</td>
                                        <td><strong>{staff.staff_code}</strong></td>
                                        <td style={{ fontWeight: '500' }}>{staff.staff_name}</td>
                                        <td>
                                            {staff.staff_institution && (
                                                <span style={{
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '4px',
                                                    background: '#eff6ff',
                                                    color: '#1e40af',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {staff.staff_institution}
                                                </span>
                                            )}
                                        </td>
                                        <td>{staff.staff_department}</td>
                                        <td>
                                            {staff.staff_type && (
                                                <span style={{
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '30px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    backgroundColor: staff.staff_type === 'Teaching' ? '#d1fae5' : '#fef3c7',
                                                    color: staff.staff_type === 'Teaching' ? '#065f46' : '#92400e'
                                                }}>
                                                    {staff.staff_type}
                                                </span>
                                            )}
                                        </td>
                                        <td>{staff.staff_phone}</td>
                                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{staff.staff_email}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        No staff records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredRecords.length > 0 && (
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
            </div>
        </div>
    );
};

export default StaffView;
