const pool = require('../config/db.config');

exports.getConsolidateReport = async (req, res, next) => {
    try {
        const { search, institution, department, quota_type } = req.query;
        
        let query = 'SELECT * FROM admission_consolidate_report WHERE 1=1';
        const params = [];

        if (institution) {
            query += ' AND institution = ?';
            params.push(institution);
        }

        if (department) {
            query += ' AND department = ?';
            params.push(department);
        }

        if (quota_type) {
            query += ' AND quota_type = ?';
            params.push(quota_type);
        }

        if (search) {
            query += ' AND (institution LIKE ? OR department LIKE ? OR quota_type LIKE ? OR admission_year LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY institution ASC, quota_type ASC, department ASC';

        const [rows] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        next(error);
    }
};

exports.getConsolidateFilters = async (req, res, next) => {
    try {
        const [institutions] = await pool.query(
            'SELECT DISTINCT institution FROM admission_consolidate_report ORDER BY institution ASC'
        );
        const [departments] = await pool.query(
            'SELECT DISTINCT department FROM admission_consolidate_report ORDER BY department ASC'
        );
        const [quotaTypes] = await pool.query(
            'SELECT DISTINCT quota_type FROM admission_consolidate_report WHERE quota_type IS NOT NULL ORDER BY quota_type ASC'
        );

        res.status(200).json({
            success: true,
            data: {
                institutions: institutions.map(r => r.institution),
                departments: departments.map(r => r.department),
                quotaTypes: quotaTypes.map(r => r.quota_type)
            }
        });
    } catch (error) {
        next(error);
    }
};
