const Record = require('../models/record.model');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');

exports.createRecord = async (req, res, next) => {
    try {
        console.log('[DEBUG] createRecord triggered');
        console.log('[DEBUG] Body fields:', Object.keys(req.body));
        console.log('[DEBUG] File:', req.file ? `Received (${req.file.size} bytes)` : 'MISSING');
        
        const result = await Record.create(req.body);
        const pdfFile = req.file; // Received via multer
        const fullRecord = await Record.getById(result.id);
        if (fullRecord && fullRecord.reference_email) {
            (async () => {
                try {
                    // Use the PDF buffer sent from the frontend
                    const pdfBuffer = pdfFile ? pdfFile.buffer : null;
                    await emailService.sendEnquiryEmail(fullRecord, pdfBuffer);
                } catch (err) {
                    console.error('Auto-email background process failed:', err);
                }
            })();
        }

        res.status(201).json({
            success: true,
            message: 'Enquiry submitted successfully',
            data: { reg_id: result.reg_id }
        });
    } catch (error) {
        next(error);
    }
};

exports.getRecords = async (req, res, next) => {
    try {
        const { search, status, fromDate, toDate, isArchived } = req.query;
        const filters = { search, status, fromDate, toDate, isArchived };
        
        // Auto archive records before fetching
        await Record.autoArchive();
        
        const records = await Record.getAll(filters);
        
        res.status(200).json({
            success: true,
            data: records
        });
    } catch (error) {
        next(error);
    }
};

exports.getRecordById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const record = await Record.getById(id);
        if (record) {
            res.status(200).json({ success: true, data: record });
        } else {
            res.status(404).json({ success: false, message: 'Record not found' });
        }
    } catch (error) {
        next(error);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }
        
        const success = await Record.updateStatus(id, status);
        
        if (success) {
            res.status(200).json({ success: true, message: 'Status updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Record not found' });
        }
    } catch (error) {
        next(error);
    }
};

exports.getStats = async (req, res, next) => {
    try {
        const stats = await Record.getStats();
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

exports.sendEmail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const record = await Record.getById(id);
        
        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }
        
        if (!record.reference_email) {
            return res.status(400).json({ success: false, message: 'No reference email found for this record' });
        }
        
        // Use the PDF buffer sent from the frontend if available
        const pdfBuffer = req.file ? req.file.buffer : null;
        const result = await emailService.sendEnquiryEmail(record, pdfBuffer);
        
        if (result.success) {
            res.status(200).json({ success: true, message: 'Email sent successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send email', error: result.error });
        }
    } catch (error) {
        next(error);
    }
};

exports.viewPdf = async (req, res, next) => {
    res.status(410).send(`
        <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h2>Backend PDF Generation is Disabled</h2>
                <p>PDFs are now generated directly in the browser for better performance.</p>
                <p>Please use the Print button in the Dashboard.</p>
            </body>
        </html>
    `);
};
