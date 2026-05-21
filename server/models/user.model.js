const db = require('../config/db.config');

class User {
    static async findByUsername(username) {
        const [rows] = await db.execute('SELECT * FROM user_master WHERE user_id = ?', [username]);
        return rows[0];
    }

    static async updatePassword(username, newPasswordHash) {
        const [result] = await db.execute(
            'UPDATE user_master SET password_hash = ? WHERE user_id = ?',
            [newPasswordHash, username]
        );
        return result.affectedRows > 0;
    }

    static async getAllUsers() {
        const [rows] = await db.execute('SELECT id, user_role, user_id, created_at, updated_at FROM user_master ORDER BY created_at DESC');
        return rows;
    }

    static async createUser(role, username, passwordHash) {
        const [result] = await db.execute(
            'INSERT INTO user_master (user_role, user_id, password_hash) VALUES (?, ?, ?)',
            [role, username, passwordHash]
        );
        return result.insertId;
    }

    static async updateUser(id, role, username, passwordHash) {
        if (passwordHash) {
            const [result] = await db.execute(
                'UPDATE user_master SET user_role = ?, user_id = ?, password_hash = ? WHERE id = ?',
                [role, username, passwordHash, id]
            );
            return result.affectedRows > 0;
        } else {
            const [result] = await db.execute(
                'UPDATE user_master SET user_role = ?, user_id = ? WHERE id = ?',
                [role, username, id]
            );
            return result.affectedRows > 0;
        }
    }

    static async deleteUser(id) {
        const [result] = await db.execute('DELETE FROM user_master WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;
