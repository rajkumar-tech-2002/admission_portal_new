const User = require('../models/user.model');
const bcrypt = require('bcrypt');

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.getAllUsers();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const { user_role, user_id, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findByUsername(user_id);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User ID already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const id = await User.createUser(user_role, user_id, passwordHash);
        res.status(201).json({ success: true, message: 'User created successfully', id });
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { user_role, user_id, password } = req.body;

        let passwordHash = null;
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(password, salt);
        }

        const success = await User.updateUser(id, user_role, user_id, passwordHash);
        if (success) {
            res.status(200).json({ success: true, message: 'User updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const success = await User.deleteUser(id);
        if (success) {
            res.status(200).json({ success: true, message: 'User deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};
