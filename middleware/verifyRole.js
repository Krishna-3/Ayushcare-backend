const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req?.role) return res.status(401).json({ 'message': 'Unauthorized' });

        if (!allowedRoles.includes(req.role)) return res.status(401), res.json({ 'message': 'Unauthorized' });
        next();
    }
}

module.exports = verifyRole;