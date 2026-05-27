import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, LogOut, Menu, X, Archive, Settings, ChevronDown, ChevronRight,
    Building2, GraduationCap, Users2, FileCheck, UserPlus, Activity, Calendar, KeyRound, Mail,
    Users, Award, BarChart3, IndianRupee, FileText
} from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import styles from '../css/AdminLayout.module.css';
import useIdleTimer from '../../hooks/useIdleTimer';
import { secureLogout } from '../../utils/auth';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMasterOpen, setIsMasterOpen] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const [isAOResportsOpen, setIsAOResportsOpen] = useState(false);

    const role = (sessionStorage.getItem('role') || 'admin').toLowerCase();
    const username = sessionStorage.getItem('username') || 'Admin User';
    const displayRole = role === 'admin' ? 'Administrator' : role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Auto-close master/reports submenu when navigating away
    useEffect(() => {
        const isMasterRoute = location.pathname.includes('/admin/master') || location.pathname.includes('/admin/change-password');
        const isReportsRoute = location.pathname.includes('/admin/reports');
        const isAORoute = location.pathname.includes('/admin/consolidate-report') || location.pathname.includes('/admin/department-count');
        
        setIsMasterOpen(isMasterRoute);
        setIsReportsOpen(isReportsRoute);
        setIsAOResportsOpen(isAORoute);
    }, [location.pathname]);

    const handleLogout = () => {
        secureLogout(navigate);
    };

    // Initialize Idle Timer (15 minutes)
    useIdleTimer(handleLogout, 15 * 60 * 1000);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const navButton = (
        <button className={styles.menuToggleBtn} onClick={toggleSidebar}>
            <Menu size={24} />
        </button>
    );

    return (
        <div className={styles.appContainer}>
            <Navbar leftContent={navButton}>
                <div className={styles.headerActions}>
                    <div className={styles.profileMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className={styles.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                            <span className={styles.profileName} style={{ fontWeight: '600', color: '#1f2937' }}>{username}</span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{displayRole}</span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <LogOut size={20} />
                        <span className={styles.logoutText}>Logout</span>
                    </button>
                </div>
            </Navbar>

            <div className={styles.layout}>
                {/* Mobile Overlay */}
                {isSidebarOpen && <div className={styles.overlay} onClick={closeSidebar}></div>}

                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
                    <nav className={styles.navLinks}>
                        {(role.includes('admin') || role.includes('enquiry')) && (
                            <>
                                <NavLink 
                                    to="/admin/dashboard" 
                                    className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                                    onClick={closeSidebar}
                                >
                                    <LayoutDashboard size={20} />
                                    Dashboard
                                </NavLink>

                                <NavLink 
                                    to="/admin/archived" 
                                    className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                                    onClick={closeSidebar}
                                >
                                    <Archive size={20} />
                                    Archived List
                                </NavLink>
                            </>
                        )}

                        {(role.includes('admin') || role.includes('admission')) && (
                            <>
                                <NavLink 
                                    to="/admin/admission-entry" 
                                    className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                                    onClick={closeSidebar}
                                >
                                    <UserPlus size={20} />
                                    Admission Entry
                                </NavLink>

                                <NavLink 
                                    to="/admin/staff-view" 
                                    className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                                    onClick={closeSidebar}
                                >
                                    <Users size={20} />
                                    Staff View
                                </NavLink>

                                <NavLink 
                                    to="/admin/certificate-entry" 
                                    className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                                    onClick={closeSidebar}
                                >
                                    <Award size={20} />
                                    Certificate Entry
                                </NavLink>

                                <NavLink 
                                    to="/admin/fees-entry" 
                                    className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                                    onClick={closeSidebar}
                                >
                                    <FileCheck size={20} />
                                    Fees Entry
                                </NavLink>

                                <NavLink 
                                    to="/admin/concession-entry" 
                                    className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                                    onClick={closeSidebar}
                                >
                                    <Award size={20} />
                                    Concession Entry
                                </NavLink>

                                {/* Reports Module - For Admin and Admission */}
                                <div className={styles.navGroup}>
                                    <div 
                                        className={`${styles.navItem} ${isReportsOpen ? styles.groupActive : ''}`} 
                                        onClick={() => setIsReportsOpen(!isReportsOpen)}
                                    >
                                        <FileText size={20} />
                                        <span style={{ flex: 1 }}>Reports</span>
                                        {isReportsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                    
                                    {isReportsOpen && (
                                        <div className={styles.subMenu}>
                                            <NavLink to="/admin/reports/to-office" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                                <FileText size={16} /> To Office
                                            </NavLink>
                                            <NavLink to="/admin/reports/to-gate-note" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                                <FileText size={16} /> To Gate Note
                                            </NavLink>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Reports Module - Only for AO */}
                        {(role === 'ao' || role === 'AO') && (
                            <div className={styles.navGroup}>
                                <div 
                                    className={`${styles.navItem} ${isAOResportsOpen ? styles.groupActive : ''}`} 
                                    onClick={() => setIsAOResportsOpen(!isAOResportsOpen)}
                                >
                                    <BarChart3 size={20} />
                                    <span style={{ flex: 1 }}>Reports</span>
                                    {isAOResportsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                                
                                {isAOResportsOpen && (
                                    <div className={styles.subMenu}>
                                        <NavLink to="/admin/consolidate-report" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <BarChart3 size={16} /> Consolidate
                                        </NavLink>
                                        <NavLink to="/admin/department-count" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <FileText size={16} /> Department Count
                                        </NavLink>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Master Module - ONLY for Admin */}
                        {role === 'admin' && (
                            <div className={styles.navGroup}>
                                <div 
                                    className={`${styles.navItem} ${isMasterOpen ? styles.groupActive : ''}`} 
                                    onClick={() => setIsMasterOpen(!isMasterOpen)}
                                >
                                    <Settings size={20} />
                                    <span style={{ flex: 1 }}>Master Module</span>
                                    {isMasterOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                                
                                {isMasterOpen && (
                                    <div className={styles.subMenu}>
                                        <NavLink to="/admin/master/departments" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Building2 size={16} /> Department Master
                                        </NavLink>
                                        <NavLink to="/admin/master/studies" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <GraduationCap size={16} /> Study Master
                                        </NavLink>
                                        <NavLink to="/admin/master/communities" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Users2 size={16} /> Community Master
                                        </NavLink>
                                        <NavLink to="/admin/master/admission-types" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <FileCheck size={16} /> Admission Type
                                        </NavLink>
                                        <NavLink to="/admin/master/reference-types" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <UserPlus size={16} /> Reference Type
                                        </NavLink>
                                        <NavLink to="/admin/master/admission-statuses" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Activity size={16} /> Status Master
                                        </NavLink>
                                        <NavLink to="/admin/master/valid-date" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Calendar size={16} /> Valid Date Master
                                        </NavLink>
                                        <NavLink to="/admin/master/districts" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Building2 size={16} /> District Master
                                        </NavLink>
                                        <NavLink to="/admin/master/schools" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <GraduationCap size={16} /> School Master
                                        </NavLink>
                                        <NavLink to="/admin/master/consultancies" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Users2 size={16} /> Consultancy Master
                                        </NavLink>
                                        <NavLink to="/admin/master/staff" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <UserPlus size={16} /> Staff Master
                                        </NavLink>
                                        <NavLink to="/admin/master/annual-income" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <FileCheck size={16} /> Annual Income Master
                                        </NavLink>
                                        <NavLink to="/admin/master/religions" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Activity size={16} /> Religion Master
                                        </NavLink>
                                        <NavLink to="/admin/master/school-types" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Calendar size={16} /> School Type Master
                                        </NavLink>
                                        <NavLink to="/admin/master/admission-years" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Calendar size={16} /> Admission Year Master
                                        </NavLink>
                                        <NavLink to="/admin/master/groups-12th" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <GraduationCap size={16} /> 12th Group Master
                                        </NavLink>
                                        <NavLink to="/admin/master/roles" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <UserPlus size={16} /> Role Master
                                        </NavLink>
                                        <NavLink to="/admin/master/concessions" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Award size={16} /> Concession Master
                                        </NavLink>
                                        <NavLink to="/admin/master/users" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Users size={16} /> User Master
                                        </NavLink>
                                        <NavLink to="/admin/master/course-fees" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <IndianRupee size={16} /> Course Fees Fix
                                        </NavLink>
                                        <NavLink to="/admin/master/email-logs" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <Mail size={16} /> Email Logs
                                        </NavLink>
                                        <NavLink to="/admin/change-password" className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.activeSub}` : styles.subNavItem} onClick={closeSidebar}>
                                            <KeyRound size={16} /> Change Password
                                        </NavLink>
                                    </div>
                                )}
                            </div>
                        )}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <div className={styles.content}>
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
