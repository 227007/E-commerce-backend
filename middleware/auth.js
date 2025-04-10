import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, please login"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: "Invalid token, please login again"
        });
    }
};

export default authUser;  