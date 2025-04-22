import asyncHandler from 'express-async-handler';
import Company from '../models/Company.js';
import User from '../models/User.js';

// Create a new company
const createCompany = asyncHandler(async (req, res) => {
    const { name, description, adminEmail } = req.body;

    const companyExists = await Company.findOne({ name });
    if (companyExists) {
        res.status(400);
        throw new Error('Company already exists');
    }

    const company = await Company.create({
        name,
        description,
        createdBy: req.user._id
    });

    if (adminEmail) {
        const tempPassword = Math.random().toString(36).slice(-8);
        
        const user = await User.create({
            username: name + ' Admin',
            email: adminEmail,
            password: tempPassword,
            userType: 'company',
            companyId: company._id
        });
    }

    res.status(201).json(company);
});

// Get all companies
const getCompanies = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    
    const query = {};
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const companies = await Company.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('createdBy', 'username email')
        .exec();

    const count = await Company.countDocuments(query);

    res.json({
        companies,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalCompanies: count
    });
});

// Get company by ID
const getCompanyById = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id)
        .populate('createdBy', 'username email');

    if (!company) {
        res.status(404);
        throw new Error('Company not found');
    }

    if (req.user.userType !== 'admin' && req.user.companyId.toString() !== company._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this company');
    }

    const productsCount = await Product.countDocuments({ companyId: company._id });
    const ordersCount = await Order.countDocuments({ company: company._id });
    const totalSales = await Order.aggregate([
        { $match: { company: company._id, isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
        ...company._doc,
        stats: {
            productsCount,
            ordersCount,
            totalSales: totalSales[0]?.total || 0
        }
    });
});

// Update company
const updateCompany = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const company = await Company.findById(req.params.id);

    if (!company) {
        res.status(404);
        throw new Error('Company not found');
    }

    if (req.user.userType !== 'admin' && req.user.companyId.toString() !== company._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this company');
    }

    company.name = name || company.name;
    company.description = description || company.description;

    const updatedCompany = await company.save();
    res.json(updatedCompany);
});

// Delete company
const deleteCompany = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id);

    if (!company) {
        res.status(404);
        throw new Error('Company not found');
    }

    const productsCount = await Product.countDocuments({ companyId: company._id });
    if (productsCount > 0) {
        res.status(400);
        throw new Error('Cannot delete company with existing products');
    }

    await company.remove();
    res.json({ message: 'Company removed' });
});

// Get company owners
const getCompanyOwners = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id);
    if (!company) {
        res.status(404);
        throw new Error('Company not found');
    }

    const owners = await User.find({ 
        companyId: company._id,
        userType: 'company'
    }).select('-password');

    res.json(owners);
});

// Add company owner
const addCompanyOwner = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const company = await Company.findById(req.params.id);
    
    if (!company) {
        res.status(404);
        throw new Error('Company not found');
    }

    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.userType !== 'customer') {
        res.status(400);
        throw new Error('User is already an admin or company owner');
    }

    user.userType = 'company';
    user.companyId = company._id;
    await user.save();

    res.json({ message: 'User added as company owner', user });
});

export { 
    createCompany, 
    getCompanies, 
    getCompanyById, 
    updateCompany, 
    deleteCompany,
    getCompanyOwners,
    addCompanyOwner
};