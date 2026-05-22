import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import apiService from '../../services/api.service';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import styles from '../../components/css/EnquiryForm.module.css';
import toast from 'react-hot-toast';
import { confirmAction } from '../../components/layout/Toast';
import RecordReport from '../../components/layout/RecordReport';
import { Link } from 'react-router-dom';

const EnquiryForm = () => {
    const [masterData, setMasterData] = useState({
        departments: [], studies: [], communities: [], 
        admissionTypes: [], referenceTypes: []
    });

    const [formData, setFormData] = useState({
        reg_no_12th: '', aadhaar_no: '', std_dob: '', std_name: '', std_mobile_no: '',
        std_whatsapp_no: '', city: '', last_studied_name: '', last_studied: '12th',
        admission_quota: '', reference_type: '', reference_way: '',
        reference_name: '', reference_email: '', reference_institution: '', reference_dept: '',
        reference_contact_no: '', selected_dept: '', selected_ug_pg: '', selected_course: ''
    });

    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfRecordData, setPdfRecordData] = useState(null);
    const reportCaptureRef = useRef(null);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const response = await apiService.get('/master');
                if (response.data.success) {
                    setMasterData(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching master data:", error);
            }
        };
        fetchMasterData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'selected_dept') {
            const selectedText = e.target.options[e.target.selectedIndex]?.text || value;
            let autoUgPg = formData.selected_ug_pg;
            if (masterData.departments) {
                const matchedDept = masterData.departments.find(d => {
                    const parts = [];
                    if (d.institution) parts.push(d.institution);
                    if (d.program && d.program !== 'null' && d.program !== 'Null' && d.program !== '(Null)') {
                        parts.push(d.program);
                    }
                    if (d.department) parts.push(d.department);
                    return parts.join('_') === selectedText;
                });
                if (matchedDept && matchedDept.type) {
                    autoUgPg = matchedDept.type;
                }
            }
            setFormData({ ...formData, [name]: value, selected_course: selectedText, selected_ug_pg: autoUgPg });
        } else if (name === 'reference_type') {
            const selectedRef = masterData.referenceTypes.find(r => r.reference_type === value);
            setFormData({ 
                ...formData, 
                [name]: value, 
                reference_way: selectedRef ? selectedRef.way : '' 
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleReset = () => {
        confirmAction("Are you sure you want to reset the form? All entered data will be lost.", () => {
            setFormData({
                reg_no_12th: '', aadhaar_no: '', std_dob: '', std_name: '', std_mobile_no: '',
                std_whatsapp_no: '', city: '', last_studied_name: '', last_studied: '12th',
                admission_quota: '', reference_type: '', reference_way: '',
                reference_name: '', reference_email: '', reference_institution: '', reference_dept: '',
                reference_contact_no: '', selected_dept: '', selected_ug_pg: '', selected_course: ''
            });
            setSuccessMessage('');
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Submit form data as JSON to get the reg_id
            const payload = new FormData();
            Object.keys(formData).forEach(key => {
                payload.append(key, formData[key]);
            });

            const apiBase = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
            const response = await axios.post(`${apiBase}/records`, payload);

            if (response.data.success) {
                const { id, reg_id } = response.data.data;
                const msg = `Enquiry submitted successfully! ID: ${reg_id}`;
                toast.success(msg);
                setSuccessMessage(msg);

                // 2. Prepare the real record data for the PDF template
                const finalRecordData = { 
                    ...formData, 
                    id: id,
                    reg_id: reg_id, 
                    admission_date_time: new Date().toISOString() 
                };
                
                setPdfRecordData(finalRecordData);
                setIsGenerating(true);

                // Wait for React to render the hidden RecordReport with the new reg_id
                await new Promise(resolve => setTimeout(resolve, 800));

                const element = document.getElementById('report-capture-area');
                const opt = {
                    margin: 0,
                    filename: `Enquiry_Report_${reg_id}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                // Generate auto-printing PDF as Blob
                const html2pdf = (await import('html2pdf.js')).default;
                const worker = html2pdf().set(opt).from(element);
                await worker.toPdf().get('pdf').then(pdf => {
                    pdf.autoPrint();
                });
                const pdfBlob = await worker.output('blob');

                // Auto print in new tab
                try {
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    window.open(pdfUrl, '_blank');
                } catch (err) {
                    console.error("Popup blocked or error opening PDF:", err);
                }

                // 3. Send PDF to backend for emailing
                if (formData.reference_email) {
                    const emailPayload = new FormData();
                    emailPayload.append('pdf', pdfBlob, `Enquiry_Report_${reg_id}.pdf`);
                    try {
                        await axios.post(`${apiBase}/records/${id}/public-email`, emailPayload);
                    } catch (err) {
                        console.error('Failed to send email:', err);
                    }
                }

                // reset form
                setFormData({
                    reg_no_12th: '', aadhaar_no: '', std_dob: '', std_name: '', std_mobile_no: '',
                    std_whatsapp_no: '', city: '', last_studied_name: '', last_studied: '12th',
                    admission_quota: '', reference_type: '', reference_way: '',
                    reference_name: '', reference_email: '', reference_institution: '', reference_dept: '',
                    reference_contact_no: '', selected_dept: '', selected_ug_pg: '', selected_course: ''
                });
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Submission error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to submit enquiry. Please try again.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
            setIsGenerating(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <Navbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link to="/login" className={styles.loginBadge} style={{ textDecoration: 'none' }}>
                        Login
                    </Link>
                    <div className={styles.publicBadge}>Public</div>
                </div>
            </Navbar>
            <div className={styles.pageContainer}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Admission Enquiry Portal</h1>
                    <p className={styles.subtitle}>Fill in your details to start the admission process</p>
                    <p className={styles.textInfo}>Status default: enquiry • Auto delete after 3 days if not confirmed</p>
                </div>

                <div className={styles.formContainer}>
                    {successMessage && (
                        <div className={styles.successMessage}>
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Personal Details */}
                        <div className={styles.formSection}>
                            <h3 className={styles.formSectionTitle}>1. Personal Details</h3>
                            <div className={styles.grid}>
                                <div className="form-group">
                                    <label className="form-label">12th Registration No <span className={styles.required}>*</span></label>
                                    <input type="text" name="reg_no_12th" value={formData.reg_no_12th} onChange={handleChange} className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Student Name <span className={styles.required}>*</span></label>
                                    <input type="text" name="std_name" value={formData.std_name} onChange={handleChange} className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Birth <span className={styles.required}>*</span></label>
                                    <input type="date" name="std_dob" value={formData.std_dob} onChange={handleChange} className="form-input" required/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mobile Number <span className={styles.required}>*</span></label>
                                    <input type="tel" name="std_mobile_no" value={formData.std_mobile_no} onChange={handleChange} className="form-input" required maxLength="10" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">WhatsApp Number</label>
                                    <input type="tel" name="std_whatsapp_no" value={formData.std_whatsapp_no} onChange={handleChange} className="form-input" maxLength="10" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Aadhaar No <span className={styles.required}>*</span></label>
                                    <input type="text" name="aadhaar_no" value={formData.aadhaar_no} onChange={handleChange} className="form-input" required maxLength="12" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                        </div>

                        {/* Academic Details */}
                        <div className={styles.formSection}>
                            <h3 className={styles.formSectionTitle}>2. Academic Details</h3>
                            <div className={styles.grid}>
                                <div className="form-group">
                                    <label className="form-label">Last Studied School / College</label>
                                    <input type="text" name="last_studied_name" value={formData.last_studied_name} onChange={handleChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Studied</label>
                                    <select name="last_studied" value={formData.last_studied} onChange={handleChange} className="form-select">
                                        <option value="">Select Level</option>
                                        {masterData.studies.map(s => <option key={s.id} value={s.study}>{s.study}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Admission Details */}
                        <div className={styles.formSection}>
                            <h3 className={styles.formSectionTitle}>3. Course Preference</h3>
                            <div className={styles.grid}>
                                <div className="form-group">
                                    <label className="form-label">Selected Department <span className={styles.required}>*</span></label>
                                    <select name="selected_dept" value={formData.selected_dept} onChange={handleChange} className="form-select" required>
                                        <option value="">Select Department</option>
                                        {masterData.departments
                                            .filter(d => formData.selected_ug_pg ? d.type === formData.selected_ug_pg : true)
                                            .map(d => {
                                                const parts = [];
                                                if (d.institution) parts.push(d.institution);
                                                if (d.program && d.program !== 'null' && d.program !== 'Null' && d.program !== '(Null)') {
                                                    parts.push(d.program);
                                                }
                                                if (d.department) parts.push(d.department);
                                                const displayText = parts.join('_');
                                                return <option key={d.id} value={displayText}>{displayText}</option>;
                                            })}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Selected UG/PG <span className={styles.required}>*</span></label>
                                    <select name="selected_ug_pg" value={formData.selected_ug_pg} onChange={handleChange} className="form-select" required>
                                        <option value="">Select Level</option>
                                        <option value="UG">UG</option>
                                        <option value="PG">PG</option>
                                        <option value="DIPLOMA">DIPLOMA</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Selected Course</label>
                                    <input type="text" name="selected_course" value={formData.selected_course} onChange={handleChange} className="form-input" required placeholder="Auto-filled from department" readOnly />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Admission Quota</label>
                                    <select name="admission_quota" value={formData.admission_quota} onChange={handleChange} className="form-select">
                                        <option value="">Select Quota</option>
                                        {masterData.admissionTypes.map(t => <option key={t.id} value={t.admission_type}>{t.admission_type}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Reference Details */}
                        <div className={styles.formSection}>
                            <h3 className={styles.formSectionTitle}>4. Reference Details</h3>
                            <div className={styles.grid}>
                                <div className="form-group">
                                    <label className="form-label">Reference Type</label>
                                    <select name="reference_type" value={formData.reference_type} onChange={handleChange} className="form-select">
                                        <option value="">Select Reference</option>
                                        {masterData.referenceTypes.map(r => <option key={r.id} value={r.reference_type}>{r.reference_type}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reference Way</label>
                                    <input type="text" name="reference_way" value={formData.reference_way} className="form-input" readOnly placeholder="Auto-filled" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reference Name</label>
                                    <input type="text" name="reference_name" value={formData.reference_name} onChange={handleChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reference Contact No</label>
                                    <input type="tel" name="reference_contact_no" value={formData.reference_contact_no} onChange={handleChange} className="form-input" maxLength="10" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reference Email <span className={styles.required}>*</span></label>
                                    <input type="email" name="reference_email" value={formData.reference_email} onChange={handleChange} className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reference Institution</label>
                                    <input 
                                        type="text"
                                        name="reference_institution" 
                                        value={formData.reference_institution} 
                                        onChange={handleChange} 
                                        className="form-input"
                                        placeholder="Enter Institution"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reference Department</label>
                                    <input 
                                        type="text"
                                        name="reference_dept" 
                                        value={formData.reference_dept} 
                                        onChange={handleChange} 
                                        className="form-input"
                                        placeholder="Enter Department"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.footer}>
                            <button 
                                type="button" 
                                className={`btn btn-secondary ${styles.resetBtn}`} 
                                onClick={handleReset}
                                disabled={loading}
                            >
                                Reset Form
                            </button>
                            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Enquiry'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
            
            {/* Hidden area for PDF capture - only rendered during submission to save performance */}
            {isGenerating && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, width: '210mm' }}>
                    <div id="report-capture-area" style={{ background: '#fff' }}>
                        <RecordReport 
                            data={pdfRecordData || formData} 
                            standalone={true} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnquiryForm;
