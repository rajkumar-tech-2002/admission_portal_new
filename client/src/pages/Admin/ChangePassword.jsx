import React, { useState } from 'react';
import { Lock, Save, Eye, EyeOff } from 'lucide-react';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';
import styles from '../../components/css/ChangePassword.module.css';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const togglePassword = (field) => {
        setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error('New passwords do not match');
        }

        if (formData.newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters long');
        }

        setLoading(true);
        try {
            const response = await apiService.post('/auth/change-password', {
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });

            if (response.data.success) {
                toast.success('Password updated successfully!');
                setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            console.error('Change password error:', error);
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={24} color="var(--primary-color)" />
                        <h2 style={{color: 'var(--primary-color)'}}>Security Settings</h2>
                    </div>
                </div>
                
                <div className={styles.cardHeader}>
                    <h3>Change Administrator Password</h3>
                    <p>Update your account password to maintain security.</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* ... (inputs) ... */}
                    <div className={styles.formGroup}>
                        <label>Current Password</label>
                        <div className={styles.inputWrapper}>
                            <input 
                                type={showPasswords.old ? "text" : "password"}
                                name="oldPassword"
                                value={formData.oldPassword}
                                onChange={handleChange}
                                placeholder="Enter current password"
                                required
                                className={styles.input}
                            />
                            <button type="button" onClick={() => togglePassword('old')} className={styles.toggleBtn}>
                                {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>New Password</label>
                        <div className={styles.inputWrapper}>
                            <input 
                                type={showPasswords.new ? "text" : "password"}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="Enter new password"
                                required
                                className={styles.input}
                            />
                            <button type="button" onClick={() => togglePassword('new')} className={styles.toggleBtn}>
                                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Confirm New Password</label>
                        <div className={styles.inputWrapper}>
                            <input 
                                type={showPasswords.confirm ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                required
                                className={styles.input}
                            />
                            <button type="button" onClick={() => togglePassword('confirm')} className={styles.toggleBtn}>
                                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            <Save size={18} />
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
