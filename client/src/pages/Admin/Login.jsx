import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';
import apiService from '../../services/api.service';
import styles from '../../components/css/Login.module.css';
import logo from '../../assets/logo.png';

const Login = () => {
    const [role, setRole] = useState('admin');
    const [rolesList, setRolesList] = useState([]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await apiService.get('/master');
                if (response.data.success && response.data.data.roles) {
                    setRolesList(response.data.data.roles);
                    // Autofills role state with the first dynamic role available
                    if (response.data.data.roles.length > 0) {
                        setRole(response.data.data.roles[0].role_name);
                    }
                }
            } catch (err) {
                console.error("Failed to load roles from master:", err);
            }
        };
        fetchRoles();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiService.post('/auth/login', { username, password, role });
            if (response.data.success) {
                const userRole = response.data.user.role || 'admin';
                sessionStorage.setItem('token', response.data.token);
                sessionStorage.setItem('role', userRole);
                sessionStorage.setItem('username', response.data.user.username || 'Admin');
                
                if (userRole.toLowerCase().includes('admission')) {
                    navigate('/admin/admission-entry');
                } else {
                    navigate('/admin/dashboard');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.backgroundBlob}></div>
            <div className={styles.backgroundBlob2}></div>
            
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Administrator Access</h2>
                    <p className={styles.subtitle}>Please enter your credentials to manage the portal</p>
                </div>

                {error && (
                    <div className={styles.errorBanner}>
                        <span>{error}</span>
                    </div>
                )}
                
                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Select Role</label>
                        <div className={styles.inputWrapper}>
                            <ShieldCheck className={styles.fieldIcon} size={18} />
                            <select 
                                className={styles.input} 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)} 
                                required
                                style={{
                                    cursor: 'pointer'
                                }}
                            >
                                {rolesList.length > 0 ? (
                                    rolesList.map(r => (
                                        <option key={r.id} value={r.role_name}>
                                            {r.role_name === 'admin' ? 'Administrator' : r.role_name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </option>
                                    ))
                                ) : (
                                    <>
                                        <option value="admin">Administrator</option>
                                        <option value="enquiry_team">Enquiry Team</option>
                                        <option value="admission_team">Admission Team</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Username</label>
                        <div className={styles.inputWrapper}>
                            <User className={styles.fieldIcon} size={18} />
                            <input 
                                type="text" 
                                className={styles.input} 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                                placeholder="Username"
                            />
                        </div>
                    </div>
                    
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock className={styles.fieldIcon} size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className={styles.input} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="Password"
                            />
                            <button 
                                type="button" 
                                className={styles.toggleBtn}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? (
                            <div className={styles.loader}></div>
                        ) : (
                            <>Login to Dashboard</>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>© 2026 Nandha Educational Institutions. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
