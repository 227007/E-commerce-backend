import jwt from 'jsonwebtoken';

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
        
        if (decoded.role !== "company") {
            return res.status(403).json({ 
                success: false, 
                message: "Company access required" 
            });
        }

        req.user = decoded; 

    } catch (error) {
        console.error("Authentication error:", error);
        res.status(403).json({ 
            success: false, 
            message: "Invalid or expired token" 
        });
    }
};

export default companyAuth;