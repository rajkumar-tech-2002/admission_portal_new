import React from 'react';
import styles from '../css/Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            &copy; {new Date().getFullYear()} Nandha Educational Institutions. All rights reserved.
        </footer>
    );
};

export default Footer;
