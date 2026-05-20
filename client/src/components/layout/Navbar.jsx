import React, { useState, useEffect } from 'react';
import styles from '../css/Navbar.module.css';
import logo from '../../assets/logo.png';

const Navbar = ({ leftContent, children }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = currentTime.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    return (
        <header className={styles.navbar}>
            <div className={styles.leftSection}>
                {leftContent && <div className={styles.leftContent}>{leftContent}</div>}
                <div className={styles.logoContainer}>
                    <img src={logo} alt="Nandha Educational Institutions Logo" className={styles.logoImage} />
                    <h2 className={styles.collegeName}>Nandha Educational Institutions</h2>
                </div>
            </div>
            <div className={styles.actions}>
                <div className={styles.clockContainer}>
                    <span className={styles.clockDate}>{formattedDate}</span>
                    <span className={styles.clockTime}>{formattedTime}</span>
                </div>
                {children}
            </div>
        </header>
    );
};

export default Navbar;
