import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import { predictSales } from '../utils/salesPrediction.js';

// Get sales report
const getSalesReport = asyncHandler(async (req, res) => {
    const { companyId, startDate, endDate, groupBy = 'day' } = req.query;
    const maxDateRange = new Date();
    maxDateRange.setFullYear(maxDateRange.getFullYear() - 1);

    const dateFilter = {};
    if (startDate) {
        const start = new Date(startDate);
        if (start < maxDateRange) {
            res.status(400);
            throw new Error('Date range cannot exceed 1 year');
        }
        dateFilter.$gte = start;
    }
    if (endDate) {
        dateFilter.$lte = new Date(endDate);
    }

    const query = { isPaid: true };
    if (Object.keys(dateFilter).length > 0) {
        query.createdAt = dateFilter;
    }

    if (req.user.userType === 'company') {
        query.company = req.user.companyId;
    } else if (companyId) {
        query.company = companyId;
    }

    let groupFormat, groupLabel;
    switch (groupBy) {
        case 'hour':
            groupFormat = { hour: { $hour: '$createdAt' } };
            groupLabel = '%H:00';
            break;
        case 'week':
            groupFormat = { week: { $week: '$createdAt' } };
            groupLabel = 'Week %U';
            break;
        case 'month':
            groupFormat = { month: { $month: '$createdAt' } };
            groupLabel = '%Y-%m';
            break;
        case 'year':
            groupFormat = { year: { $year: '$createdAt' } };
            groupLabel = '%Y';
            break;
        default: 
            groupFormat = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
            groupLabel = '%Y-%m-%d';
    }

    const salesData = await Order.aggregate([
        { $match: query },
        {
            $group: {
                _id: groupFormat,
                totalSales: { $sum: '$totalPrice' },
                orderCount: { $sum: 1 },
                avgOrderValue: { $avg: '$totalPrice' }
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    const topProducts = await Order.aggregate([
        { $match: query },
        { $unwind: '$orderItems' },
        {
            $group: {
                _id: '$orderItems.product',
                totalSold: { $sum: '$orderItems.quantity' },
                totalRevenue: {
                    $sum: {
                        $multiply: ['$orderItems.price', '$orderItems.quantity']
                    }
                }
            }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $project: {
                productId: '$_id',
                productName: '$product.name',
                totalSold: 1,
                totalRevenue: 1,
                _id: 0
            }
        }
    ]);

    const prediction = await predictSales(query.company);

    res.json({
        salesData,
        topProducts,
        prediction,
        groupBy,
        query
    });
});

// Get company performance report
const getCompanyPerformanceReport = asyncHandler(async (req, res) => {
    if (req.user.userType !== 'admin') {
        res.status(403);
        throw new Error('Not authorized as admin');
    }

    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = { isPaid: true };
    if (Object.keys(dateFilter).length > 0) {
        query.createdAt = dateFilter;
    }

    const companyPerformance = await Order.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$company',
                totalSales: { $sum: '$totalPrice' },
                orderCount: { $sum: 1 },
                avgOrderValue: { $avg: '$totalPrice' }
            }
        },
        { $sort: { totalSales: -1 } },
        {
            $lookup: {
                from: 'companies',
                localField: '_id',
                foreignField: '_id',
                as: 'company'
            }
        },
        { $unwind: '$company' },
        {
            $project: {
                companyId: '$_id',
                companyName: '$company.name',
                totalSales: 1,
                orderCount: 1,
                avgOrderValue: 1,
                _id: 0
            }
        }
    ]);

    res.json(companyPerformance);
});

export {
    getSalesReport,
    getCompanyPerformanceReport
};