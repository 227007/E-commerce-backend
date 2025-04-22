const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (roles.length && !roles.includes(req.user.userType)) {
            res.status(403);
            throw new Error(`User role ${req.user.userType} is not authorized to access this route`);
        }
        next();
    };
};

export default authorize;