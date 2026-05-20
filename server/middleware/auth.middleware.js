const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            if (req.originalUrl.includes('/pdf')) {
                return res.redirect('/admin/login');
            }
            return res.status(401).json({ success: false, message: 'Authentication failed' });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = { userId: decodedToken.userId, role: decodedToken.role };
        next();
    } catch (error) {
        if (req.originalUrl.includes('/pdf')) {
            return res.redirect('/admin/login');
        }
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};
