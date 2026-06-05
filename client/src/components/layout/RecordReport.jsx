import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Loader } from 'lucide-react';
import apiService from '../../services/api.service';
import styles from '../css/RecordReport.module.css';
import { formatDate } from '../../utils/dateFormatter';
import logoImg from '../../assets/report-logo.png';

const RecordReport = ({ recordId, data, onClose, standalone = false }) => {
    const [record, setRecord] = useState(data || null);
    const [loading, setLoading] = useState(!data);
    const [downloading, setDownloading] = useState(false);
    const reportRef = useRef(null);

    useEffect(() => {
        if (data) {
            setRecord(data);
            setLoading(false);
            return;
        }

        const fetchRecord = async () => {
            try {
                const response = await apiService.get(`/records/${recordId}`);
                if (response.data.success) {
                    setRecord(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching record:', error);
            } finally {
                setLoading(false);
            }
        };
        if (recordId) fetchRecord();
    }, [recordId, data]);

    const handleDownloadPdf = async () => {
        if (!reportRef.current) return;
        setDownloading(true);
        try {
            const element = reportRef.current;
            const opt = {
                margin: 0,
                filename: `Admission_Report_${record.reg_id}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            const html2pdf = (await import('html2pdf.js')).default;
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF generation error:', error);
        } finally {
            setDownloading(false);
        }
    };


    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
    };

    if (loading) {
        return (
            <div className={standalone ? "" : styles.overlay}>
                <div className={styles.previewContainer} style={{ alignItems: 'center', justifyContent: 'center', padding: '3rem', background: standalone ? '#fff' : '' }}>
                    <Loader size={32} className="spin" /> Loading report...
                </div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className={standalone ? "" : styles.overlay}>
                <div className={styles.previewContainer} style={{ alignItems: 'center', justifyContent: 'center', padding: '3rem', background: standalone ? '#fff' : '' }}>
                    <p>Record not found</p>
                    {!standalone && <button onClick={onClose} className={styles.btnClose}><X size={16} /> Close</button>}
                </div>
            </div>
        );
    }

    const ReportContent = (
        <div className={styles.reportPage} ref={reportRef} style={standalone ? { boxShadow: 'none', margin: '0 auto' } : {}}>
            <div className={styles.reportBorder}>

                {/* ===== RED HEADER BANNER (Logo + Heading + Subheading) ===== */}
                <div className={styles.reportHeader}>
                    <img src={logoImg} alt="NEI Logo" className={styles.headerLogo} />
                    <div className={styles.headerText}>
                        <h1>NANDHA EDUCATIONAL INSTITUTIONS</h1>
                        <h2>Erode - 52.</h2>
                    </div>
                </div>

                {/* ===== ENQUIRY NUMBER to #8 — SINGLE TABLE ===== */}
                <table className={styles.detailTable}>
                    <tbody>
                        {/* Enquiry Number + Admission Date + Time */}
                        <tr>
                            <td className={styles.metaRow} style={{ borderRight: '1px solid #000', width: '45%' }}>
                                Enquiry Number : {record.reg_id}
                            </td>
                            <td className={styles.metaRow} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <strong>Admission Date :</strong> {formatDate(record.admission_date_time)}
                                &nbsp;&nbsp;&nbsp;&nbsp;
                                <strong>Time :</strong> {formatTime(record.admission_date_time)}
                            </td>
                        </tr>

                        {/* +2 Reg. Number */}
                        <tr>
                            <td className={styles.metaRow} colSpan="2">
                                +2 Reg. Number : {record.reg_no_12th || ''}
                            </td>
                        </tr>

                        {/* 1. Student Name - BOLD */}
                        <tr>
                            <td className={styles.fieldLabelBold} colSpan="2">
                                1. Student Name : {(record.std_name || '').toUpperCase()}
                            </td>
                        </tr>

                        {/* 2. Date of Birth */}
                        <tr>
                            <td className={styles.fieldLabel} colSpan="2">
                                2. Date of Birth : {formatDate(record.std_dob)}
                            </td>
                        </tr>

                        {/* 3. Contact Number - BOLD */}
                        <tr>
                            <td className={styles.fieldLabelBold} colSpan="2">
                                3. Contact Number : {record.std_mobile_no || ''}
                            </td>
                        </tr>

                        {/* 4. Last Studied + Last Studied value on right */}
                        <tr>
                            <td className={styles.fieldLabel}>
                                4. Name of the College / School Last Studied : {(record.last_studied_name || '').toUpperCase()}
                            </td>
                            <td className={styles.fieldLabel} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                Last Studied : {record.last_studied || ''}
                            </td>
                        </tr>

                        {/* 5. Course */}
                        <tr>
                            <td className={styles.fieldLabel} colSpan="2">
                                5. Name of the Course : {record.selected_course}
                            </td>
                        </tr>

                        {/* 6. Community + Quota */}
                        <tr>
                            <td className={styles.fieldLabel} colSpan="2">
                                6. Community : {record.community || ''}
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                Quota : {record.admission_quota || ''}
                            </td>
                        </tr>

                        {/* 7. First Graduate */}
                        <tr>
                            <td className={styles.fieldLabel} colSpan="2">
                                7. First Graduate :
                            </td>
                        </tr>

                        {/* 8. Admission Recommended Person */}
                        <tr>
                            <td className={styles.fieldLabel} colSpan="2">
                                8. Admission Recommended Person :
                                <br />
                                <div style={{ marginLeft: '55px', marginTop: '12px', marginBottom: '12px', display: 'flex', gap: '20px' }}>
                                    <div style={{ minWidth: '150px' }}>
                                        {record.reference_type || ''}
                                        {record.reference_type === 'Student' && record.reference_way ? ` (${record.reference_way})` : ''}
                                    </div>
                                    <div>
                                        {record.reference_institution && <span>{record.reference_institution} / </span>}
                                        {record.reference_dept || ''} 
                                        {(record.reference_institution || record.reference_dept) && record.reference_name ? ' - ' : ''} 
                                        {record.reference_name || ''}
                                        {record.reference_contact_no ? ` - ${record.reference_contact_no}` : ''}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ===== 9. FEES DETAILS (Section Header) ===== */}
                <div className={styles.sectionHeader}>9. Fees Details</div>

                {/* ===== Fees Fixed / Scholarship / Amount / Fees to be Paid TABLE ===== */}
                <table className={styles.feesTable}>
                    <tbody>
                        <tr>
                            <td style={{ width: '50%' }}>Fees Fixed</td>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td>Type of Scholarship</td>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td>Scholarship Amount</td>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td>Fees to be Paid</td>
                            <td>&nbsp;</td>
                        </tr>
                    </tbody>
                </table>

                {/* ===== 10. FEES PAY DETAILS (Section Header) ===== */}
                <div className={styles.sectionHeader}>10. Fees Pay Details</div>

                {/* ===== Date / Paid Amount / Balance / Remark TABLE ===== */}
                <table className={styles.feesTable}>
                    <thead>
                        <tr>
                            <th style={{ width: '22%' }}>Date</th>
                            <th style={{ width: '26%' }}>Paid Amount</th>
                            <th style={{ width: '26%' }}>Balance</th>
                            <th style={{ width: '26%' }}>Remark</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                    </tbody>
                </table>

                {/* ===== FOOTER SIGNATURES ===== */}
                <div className={styles.reportFooter}>
                    <span>Prepared By</span>
                    <span>Verified By</span>
                    <span>AO</span>
                    <span>Secretary</span>
                </div>

            </div>
        </div>
    );

    if (standalone) {
        return ReportContent;
    }

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.previewContainer}>
                {/* Toolbar */}
                <div className={styles.previewHeader}>
                    <h3>Admission Report — {record.reg_id}</h3>
                    <div className={styles.previewActions}>
                        <button onClick={handleDownloadPdf} className={styles.btnDownload} disabled={downloading}>
                            {downloading ? <Loader size={16} /> : <Download size={16} />}
                            {downloading ? 'Generating...' : 'Download PDF'}
                        </button>
                        <button onClick={onClose} className={styles.btnClose}>
                            <X size={16} /> Close
                        </button>
                    </div>
                </div>

                {/* Preview Body */}
                <div className={styles.previewBody}>
                    {ReportContent}
                </div>
            </div>
        </div>
    );
};

export default RecordReport;
