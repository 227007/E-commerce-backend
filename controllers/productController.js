import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import Company from '../models/Company.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/upload.js';

// Create a product
const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock, bestseller } = req.body;

    if (req.user.userType !== 'company') {
        res.status(403);
        throw new Error('Not authorized as a company owner');
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
        res.status(404);
        throw new Error('Company not found');
    }

    if (!req.files || req.files.length === 0) {
        res.status(400);
        throw new Error('Please upload at least one image');
    }

    const images = await Promise.all(
        req.files.map(file => uploadToCloudinary(file.buffer)))
        .catch(() => {
            res.status(500);
            throw new Error('Error uploading images to Cloudinary');
        });

    const product = new Product({
        name,
        description,
        price,
        images: images.map(img => img.secure_url),
        category,
        stock,
        bestseller,
        companyId: company._id
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// Get all products
const getProducts = asyncHandler(async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword ? {
        $or: [
            { name: { $regex: req.query.keyword, $options: 'i' } },
            { description: { $regex: req.query.keyword, $options: 'i' } }
        ]
    } : {};

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .populate('companyId', 'name');

    res.json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        count
    });
});

// Get product by ID
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('companyId', 'name description logo');

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// Update a product
const updateProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock, bestseller } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    if (req.user.userType !== 'admin' && (!req.user.companyId || product.companyId.toString() !== req.user.companyId.toString())) {
        res.status(403);
        throw new Error('Not authorized to update this product');
    }

    let images = product.images;
    if (req.files && req.files.length > 0) {
        await Promise.all(
            product.images.map(imgUrl => deleteFromCloudinary(imgUrl)))
            .catch(err => console.error('Error deleting old images:', err));

        images = await Promise.all(
            req.files.map(file => uploadToCloudinary(file.buffer)))
            .then(results => results.map(img => img.secure_url));
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.stock = stock || product.stock;
    product.bestseller = bestseller !== undefined ? bestseller : product.bestseller;
    product.images = images;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
});

// Delete a product
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    if (req.user.userType !== 'admin' && (!req.user.companyId || product.companyId.toString() !== req.user.companyId.toString())) {
        res.status(403);
        throw new Error('Not authorized to delete this product');
    }

    await Promise.all(
        product.images.map(imgUrl => deleteFromCloudinary(imgUrl)))
        .catch(err => console.error('Error deleting images:', err));

    await product.remove();
    res.json({ message: 'Product removed successfully' });
});

// Advanced product search
const advancedProductSearch = asyncHandler(async (req, res) => {
    const {
        query,
        category,
        minPrice,
        maxPrice,
        company,
        minRating,
        bestseller,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const searchQuery = {};

    if (query) {
        searchQuery.$text = { $search: query };
    }

    if (category) {
        searchQuery.category = category;
    }

    if (minPrice || maxPrice) {
        searchQuery.price = {};
        if (minPrice) searchQuery.price.$gte = Number(minPrice);
        if (maxPrice) searchQuery.price.$lte = Number(maxPrice);
    }

    if (company) {
        searchQuery.companyId = company;
    }

    if (minRating) {
        searchQuery.rating = { $gte: Number(minRating) };
    }

    if (bestseller) {
        searchQuery.bestseller = bestseller === 'true';
    }

    const sortOptions = {};
    if (sortBy === 'price') {
        sortOptions.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
        sortOptions.rating = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'newest') {
        sortOptions.createdAt = -1;
    } else {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const products = await Product.find(searchQuery)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('companyId', 'name');

    const count = await Product.countDocuments(searchQuery);

    const categories = await Product.distinct('category');
    const companies = await Product.distinct('companyId');
    const populatedCompanies = await Company.find({ _id: { $in: companies } }).select('name');

    const priceRange = await Product.aggregate([
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ]);

    res.json({
        products,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalProducts: count,
        facets: {
            categories,
            companies: populatedCompanies,
            priceRange: priceRange[0] || { min: 0, max: 0 }
        }
    });
});

export {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    advancedProductSearch
};