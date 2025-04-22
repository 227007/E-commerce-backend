import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Get all users with filtering
const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, userType, companyId } = req.query;

    const query = {};
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    if (userType) query.userType = userType;
    if (companyId) query.companyId = companyId;

    const users = await User.find(query)
        .select('-password -loginAttempts -lockUntil')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('companyId', 'name');

    const count = await User.countDocuments(query);

    res.json({
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalUsers: count
    });
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-password -loginAttempts -lockUntil')
        .populate('companyId', 'name description');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (req.user.userType !== 'admin' && req.user._id.toString() !== req.params.id) {
        res.status(403);
        throw new Error('Not authorized to view this user');
    }

    res.json(user);
});

// Update user profile
const updateUser = asyncHandler(async (req, res) => {
    const { username, email, phone, password, userType, companyId, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (req.user.userType !== 'admin' && req.user._id.toString() !== req.params.id) {
        res.status(403);
        throw new Error('Not authorized to update this user');
    }

    if (req.user.userType !== 'admin') {
        user.username = username || user.username;
        user.phone = phone || user.phone;

        if (password) {
            user.password = password;
        }
    }

    else {
        user.username = username || user.username;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        if (userType) user.userType = userType;
        if (companyId) user.companyId = companyId;
        if (isActive !== undefined) user.isActive = isActive;
        if (password) user.password = password;
    }

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        userType: updatedUser.userType,
        companyId: updatedUser.companyId,
        isActive: updatedUser.isActive
    });
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.userType === 'admin') {
        res.status(400);
        throw new Error('Cannot delete admin users');
    }

    const orderCount = await Order.countDocuments({ user: user._id });
    if (orderCount > 0) {
        res.status(400);
        throw new Error('Cannot delete user with existing orders');
    }

    await user.remove();
    res.json({ message: 'User removed' });
});

// Get dashboard statistics (Admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
    const usersCount = await User.aggregate([
        { $group: { _id: '$userType', count: { $sum: 1 } } }
    ]);

    const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'username')
        .populate('company', 'name');

    const salesSummary = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$totalPrice' },
                avgOrderValue: { $avg: '$totalPrice' },
                orderCount: { $sum: 1 }
            }
        }
    ]);

    const topCompanies = await Order.aggregate([
        { $group: { _id: '$company', totalSales: { $sum: '$totalPrice' } } },
        { $sort: { totalSales: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
        { $unwind: '$company' },
        { $project: { companyName: '$company.name', totalSales: 1 } }
    ]);

    res.json({
        usersCount,
        recentOrders,
        salesSummary: salesSummary[0] || {},
        topCompanies
    });
});

export {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDashboardStats
};