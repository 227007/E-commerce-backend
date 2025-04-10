import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const companyAuth = async (req, res, next) => {
    const { token } = req.headers;

    if (!token) {
        return res.status(403).json({
            success: false,
            message: "Authorization token required"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role !== "company") {
            return res.status(403).json({
                success: false,
                message: "Company access required"
            });
        }

        req.user = user; 
        next();

    } catch (error) {
        console.error("Authentication error:", error);
        res.status(403).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

export default companyAuth;
