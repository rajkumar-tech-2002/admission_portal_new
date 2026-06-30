const nodemailer = require('nodemailer');
const db = require('../config/db.config');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false // Often required for certain SMTP servers
            }
        });
    }

    async sendEnquiryEmail(record, pdfBuffer) {
        const mailOptions = {
            from: `"Nandha Educational Institutions" <${process.env.SMTP_USER}>`,
            to: record.reference_email,
            subject: `Admission Enquiry Report - ${record.reg_id}`,
            text: `Dear ${record.reference_name || 'Referrer'},\n\nPlease find the Admission Enquiry details for ${record.std_name}.\n\nReg ID: ${record.reg_id}\n\nRegards,\nNandha Educational Institutions`,
            attachments: pdfBuffer ? [
                {
                    filename: `Enquiry_Report_${record.reg_id}.pdf`,
                    content: pdfBuffer
                }
            ] : []
        };

        try {
            await this.transporter.sendMail(mailOptions);
            await this.logEmail(record, 'Sent');
            await this.updateRecordStatus(record.id, 'Sent');
            return { success: true };
        } catch (error) {
            console.error('Email sending failed:', error);
            await this.logEmail(record, 'Failed', error.message);
            await this.updateRecordStatus(record.id, 'Failed');
            return { success: false, error: error.message };
        }
    }

    async logEmail(record, status, errorMessage = null) {
        try {
            const sql = `
                INSERT INTO email_logs (record_id, reg_id, recipient_email, status, error_message)
                VALUES (?, ?, ?, ?, ?)
            `;
            await db.execute(sql, [record.id, record.reg_id, record.reference_email, status, errorMessage]);
        } catch (error) {
            console.error('Logging email failed:', error);
        }
    }

    async updateRecordStatus(id, status) {
        try {
            const sql = 'UPDATE record_master SET email_status = ?, email_sent_at = NOW() WHERE id = ?';
            await db.execute(sql, [status, id]);
        } catch (error) {
            console.error('Updating record email status failed:', error);
        }
    }
}

module.exports = new EmailService();
