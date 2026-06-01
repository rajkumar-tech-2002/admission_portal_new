const pool = require('../config/db.config');

exports.getConsolidateReport = async (req, res, next) => {
    try {
        const { search, institution, department, quota_type, admission_year } = req.query;
        
        let query = 'SELECT * FROM admission_consolidate_report WHERE 1=1';
        const params = [];

        if (institution) {
            const instArray = institution.split(',').map(i => i.trim());
            query += ' AND institution IN (?)';
            params.push(instArray);
        }

        if (department) {
            const deptArray = department.split(',').map(d => d.trim());
            query += ' AND department IN (?)';
            params.push(deptArray);
        }

        if (quota_type) {
            const quotaArray = quota_type.split(',').map(q => q.trim());
            query += ' AND quota_type IN (?)';
            params.push(quotaArray);
        }

        if (admission_year) {
            const yearArray = admission_year.split(',').map(y => y.trim());
            query += ' AND admission_year IN (?)';
            params.push(yearArray);
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
        const [admissionYears] = await pool.query(
            'SELECT DISTINCT admission_year FROM admission_consolidate_report WHERE admission_year IS NOT NULL ORDER BY admission_year ASC'
        );
        const [deptMapping] = await pool.query(
            'SELECT DISTINCT institution, department FROM admission_consolidate_report WHERE institution IS NOT NULL AND department IS NOT NULL'
        );

        res.status(200).json({
            success: true,
            data: {
                institutions: institutions.map(r => r.institution),
                departments: departments.map(r => r.department),
                quotaTypes: quotaTypes.map(r => r.quota_type),
                admissionYears: admissionYears.map(r => r.admission_year),
                deptMapping: deptMapping
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getDepartmentCount = async (req, res, next) => {
    try {
        const { search, college, department } = req.query;
        let query = 'SELECT * FROM admission_count_department WHERE 1=1';
        const params = [];

        if (college) {
            query += ' AND college = ?';
            params.push(college);
        }
        if (department) {
            query += ' AND department = ?';
            params.push(department);
        }
        if (search) {
            query += ' AND (college LIKE ? OR department LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY college ASC, department ASC';

        const [rows] = await pool.query(query, params);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

exports.getMangCounsReport = async (req, res, next) => {
    try {
        const { college, quota } = req.query;
        let query = 'SELECT * FROM admission_report_mang_couns WHERE 1=1';
        const params = [];

        if (college) {
            const collegeArray = college.split(',').map(c => c.trim());
            query += ' AND college IN (?)';
            params.push(collegeArray);
        }

        if (quota) {
            const quotaArray = quota.split(',').map(q => q.trim());
            query += ' AND quota IN (?)';
            params.push(quotaArray);
        }

        query += ' ORDER BY college ASC, quota ASC';

        const [rows] = await pool.query(query, params);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};
