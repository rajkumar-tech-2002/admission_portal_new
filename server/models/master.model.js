const db = require('../config/db.config');

class Master {
    static async getAllDepartments() {
        // We select the raw department and also parse it for institution/dept_name
        const [rows] = await db.execute(`
            SELECT *
            FROM department_master
            ORDER BY department
        `);
        return rows;
    }

    static async getAllStudies() {
        const [rows] = await db.execute('SELECT * FROM study_master');
        return rows;
    }

    static async getAllCommunities() {
        const [rows] = await db.execute('SELECT * FROM community_master');
        return rows;
    }

    static async getAllAdmissionTypes() {
        const [rows] = await db.execute('SELECT * FROM admission_type_master');
        return rows;
    }

    static async getAllReferenceTypes() {
        const [rows] = await db.execute('SELECT * FROM reference_type_master');
        return rows;
    }

    static async getAllAdmissionStatuses() {
        const [rows] = await db.execute('SELECT * FROM admission_status_master');
        return rows;
    }

    static async getValidDate() {
        const [rows] = await db.execute('SELECT * FROM valid_date_master LIMIT 1');
        return rows[0];
    }

    static async getAllFromTable(tableName) {
        const [rows] = await db.execute(`SELECT * FROM ${tableName}`);
        return rows;
    }

    // Generic CRUD
    static getTable(type) {
        const mapping = {
            'departments': 'department_master',
            'studies': 'study_master',
            'communities': 'community_master',
            'admission-types': 'admission_type_master',
            'reference-types': 'reference_type_master',
            'admission-statuses': 'admission_status_master',
            'valid-date': 'valid_date_master',
            'districts': 'district_master',
            'schools': 'school_master',
            'consultancies': 'consultancy_master',
            'staff': 'staff_master',
            'annual-income': 'annual_income_master',
            'religions': 'religion_master',
            'school-types': 'school_type_master',
            'admission-years': 'admission_year_master',
            'groups-12th': 'group_in_12th_master',
            'roles': 'role_master'
        };
        return mapping[type];
    }

    static async create(type, data) {
        const table = this.getTable(type);
        if (!table) throw new Error('Invalid table type');

        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');
        
        const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
        const [result] = await db.execute(sql, values);
        return result.insertId;
    }

    static async update(type, id, data) {
        const table = this.getTable(type);
        if (!table) throw new Error('Invalid table type');

        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(',');
        
        const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
        const [result] = await db.execute(sql, [...values, id]);
        return result.affectedRows > 0;
    }

    static async delete(type, id) {
        const table = this.getTable(type);
        if (!table) throw new Error('Invalid table type');

        const sql = `DELETE FROM ${table} WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);
        return result.affectedRows > 0;
    }

    static async getEmailLogs(search = '') {
        let sql = 'SELECT * FROM email_logs';
        let params = [];

        if (search) {
            sql += ' WHERE reg_id LIKE ? OR recipient_email LIKE ? OR status LIKE ? OR error_message LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY sent_at DESC';
        const [rows] = await db.execute(sql, params);
        return rows;
    }
}

module.exports = Master;
