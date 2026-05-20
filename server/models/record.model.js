const db = require('../config/db.config');

class Record {
    static async generateRegId() {
        // Fetch the latest numeric reg_id that is in the new format (length < 8)
        // This ignores the old 2026000001 format which was 10 digits long
        const [rows] = await db.execute(
            'SELECT reg_id FROM record_master WHERE LENGTH(reg_id) < 8 ORDER BY CAST(reg_id AS UNSIGNED) DESC LIMIT 1'
        );

        let nextId = 4000;
        if (rows.length > 0) {
            const lastId = parseInt(rows[0].reg_id, 10);
            if (!isNaN(lastId)) {
                nextId = lastId + 1;
            }
        }
        return nextId.toString();
    }

    static async create(recordData) {
        // Check for duplicate Aadhaar number with archive_status = 'New'
        if (recordData.aadhaar_no) {
            const [existingAadhaar] = await db.execute(
                'SELECT id FROM record_master WHERE aadhaar_no = ? AND archive_status = "New" LIMIT 1',
                [recordData.aadhaar_no]
            );

            if (existingAadhaar.length > 0) {
                const error = new Error('A record with this Aadhaar number already exists and is currently active.');
                error.statusCode = 400;
                throw error;
            }
        }

        // Check for duplicate 12th Registration Number with archive_status = 'New'
        if (recordData.reg_no_12th) {
            const [existingReg] = await db.execute(
                'SELECT id FROM record_master WHERE reg_no_12th = ? AND archive_status = "New" LIMIT 1',
                [recordData.reg_no_12th]
            );

            if (existingReg.length > 0) {
                const error = new Error('A record with this 12th Registration Number already exists and is currently active.');
                error.statusCode = 400;
                throw error;
            }
        }

        const regId = await this.generateRegId();
        const sql = `
            INSERT INTO record_master (
                reg_id, reg_no_12th, aadhaar_no, std_dob, std_name, std_mobile_no, std_whatsapp_no,
                city, last_studied_name, last_studied, community, admission_quota, reference_type,
                reference_way, reference_name, reference_email, reference_institution, reference_dept,
                reference_contact_no, selected_dept, selected_ug_pg, selected_course
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            regId, recordData.reg_no_12th, recordData.aadhaar_no, recordData.std_dob, recordData.std_name,
            recordData.std_mobile_no, recordData.std_whatsapp_no, recordData.city, recordData.last_studied_name,
            recordData.last_studied, recordData.community, recordData.admission_quota, recordData.reference_type,
            recordData.reference_way, recordData.reference_name, recordData.reference_email, recordData.reference_institution,
            recordData.reference_dept, recordData.reference_contact_no, recordData.selected_dept, recordData.selected_ug_pg,
            recordData.selected_course
        ];

        const [result] = await db.execute(sql, values);
        return { id: result.insertId, reg_id: regId };
    }

    static async autoArchive() {
        // Fetch the configuration from valid_date_master
        const [masterRows] = await db.execute('SELECT date_count, archive_status, reference_way FROM valid_date_master LIMIT 1');
        const config = masterRows.length > 0 ? masterRows[0] : { date_count: 3, archive_status: 'Enquiry,Discontinue', reference_way: 'Normal' };
        
        const daysLimit = config.date_count;
        const targetStatuses = (config.archive_status || '').split(',').map(s => s.trim()).filter(s => s);
        const targetReferenceWays = (config.reference_way || '').split(',').map(w => w.trim()).filter(w => w);

        if (targetStatuses.length === 0 || targetReferenceWays.length === 0) {
            // If no statuses or reference ways are targeted, all archived records should be moved back to 'New'
            await db.execute("UPDATE record_master SET archive_status = 'New' WHERE archive_status = 'Archived'");
            return;
        }

        const statusPlaceholders = targetStatuses.map(() => '?').join(',');
        const wayPlaceholders = targetReferenceWays.map(() => '?').join(',');

        // 1. Move to 'Archived' if they match the target status AND match target reference way AND exceed the days limit
        const archiveSql = `
            UPDATE record_master 
            SET archive_status = 'Archived' 
            WHERE archive_status = 'New' 
            AND admission_status IN (${statusPlaceholders})
            AND (
                reference_way IN (${wayPlaceholders})
                OR (
                    'Normal' IN (${wayPlaceholders})
                    AND (reference_way IS NULL OR reference_way = '')
                )
            )
            AND DATEDIFF(NOW(), admission_date_time) >= ?
        `;
        await db.execute(archiveSql, [...targetStatuses, ...targetReferenceWays, ...targetReferenceWays, daysLimit]);

        // 2. Move back to 'New' if they NO LONGER match the criteria
        // (This happens if the user increases the days limit or removes a status or reference way from the archive targets)
        const restoreSql = `
            UPDATE record_master 
            SET archive_status = 'New' 
            WHERE archive_status = 'Archived' 
            AND (
                admission_status NOT IN (${statusPlaceholders})
                OR NOT (
                    reference_way IN (${wayPlaceholders})
                    OR (
                        'Normal' IN (${wayPlaceholders})
                        AND (reference_way IS NULL OR reference_way = '')
                    )
                )
                OR DATEDIFF(NOW(), admission_date_time) < ?
            )
        `;
        await db.execute(restoreSql, [...targetStatuses, ...targetReferenceWays, ...targetReferenceWays, daysLimit]);
    }

    static async getAll(filters) {
        let sql = 'SELECT * FROM record_master WHERE 1=1';
        let params = [];

        // Archive Status Filter (Default to 'New' if not specified)
        const archiveStatus = filters.isArchived === 'true' ? 'Archived' : 'New';
        sql += ' AND archive_status = ?';
        params.push(archiveStatus);

        if (filters.search) {
            sql += ' AND (std_name LIKE ? OR reg_id LIKE ? OR reg_no_12th LIKE ? OR aadhaar_no LIKE ? OR reference_email LIKE ? OR std_mobile_no LIKE ? OR std_whatsapp_no LIKE ? OR reference_contact_no LIKE ? OR city LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (filters.status) {
            sql += ' AND admission_status = ?';
            params.push(filters.status);
        }

        if (filters.fromDate && filters.toDate) {
            sql += ' AND admission_date_time >= ? AND admission_date_time <= ?';
            params.push(filters.fromDate, filters.toDate);
        }

        sql += ' ORDER BY admission_date_time DESC';

        const [rows] = await db.execute(sql, params);
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.execute('SELECT * FROM record_master WHERE id = ?', [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    static async updateStatus(id, status) {
        const sql = 'UPDATE record_master SET admission_status = ? WHERE id = ?';
        const [result] = await db.execute(sql, [status, id]);
        return result.affectedRows > 0;
    }

    static async getStats() {
        // Count by admission_status for active records (archive_status = 'New')
        const [statusCounts] = await db.execute(`
            SELECT admission_status, COUNT(*) as count 
            FROM record_master 
            WHERE archive_status = 'New' 
            GROUP BY admission_status
        `);

        // Count active vs archived
        const [archiveCounts] = await db.execute(`
            SELECT archive_status, COUNT(*) as count 
            FROM record_master 
            GROUP BY archive_status
        `);

        const stats = {
            Enquiry: 0,
            Admitted: 0,
            Discontinue: 0,
            TotalActive: 0,
            TotalArchived: 0
        };

        statusCounts.forEach(row => {
            if (row.admission_status in stats) {
                stats[row.admission_status] = row.count;
            }
        });

        archiveCounts.forEach(row => {
            if (row.archive_status === 'New') stats.TotalActive = row.count;
            if (row.archive_status === 'Archived') stats.TotalArchived = row.count;
        });

        return stats;
    }
}

module.exports = Record;
