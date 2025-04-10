import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
    const { token } = req.headers;

    if (!token) {
        return res.status(403).json({ success: false, message: "Not Authorized. Login Again." });
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);

        if (token_decode.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access Denied. Admins only." });
        }

        req.user = token_decode;
        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, message: "Invalid or Expired Token." });
    }
};

export default adminAuth;
