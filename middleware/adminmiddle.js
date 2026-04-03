/**
 * Admin Middleware
 * - Allows only users with role `admin`
 */

/**
 * Ensure authenticated user is an admin.
 */
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
};

module.exports = isAdmin;
