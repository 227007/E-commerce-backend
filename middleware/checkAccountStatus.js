import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const checkAccountStatus = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user.isActive) {
        res.status(403);
        throw new Error('Account is deactivated. Please contact admin.');
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
        const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        res.status(403);
        throw new Error(`Account temporarily locked. Try again after ${remainingTime} minutes.`);
    }

    next();
});

export default checkAccountStatus;