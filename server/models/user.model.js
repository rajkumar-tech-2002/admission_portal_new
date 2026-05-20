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
}

module.exports = User;
