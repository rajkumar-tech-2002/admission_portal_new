class PdfService {
    /**
     * @deprecated Backend PDF generation is disabled. 
     * All PDFs are now generated on the frontend and sent to the server.
     */
    async generateEnquiryPdf(record) {
        console.log('[PdfService] Backend PDF generation is disabled. Use frontend upload.');
        return null;
    }
}

module.exports = new PdfService();
