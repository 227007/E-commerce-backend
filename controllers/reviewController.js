import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Create a product review
const createReview = asyncHandler(async (req, res) => {
    const { productId, rating, comment } = req.body;

    const hasPurchased = await Order.findOne({
        user: req.user._id,
        'orderItems.product': productId,
        isPaid: true
    });

    if (!hasPurchased) {
        res.status(400);
        throw new Error('You can only review purchased products');
    }

    const alreadyReviewed = await Review.findOne({
        user: req.user._id,
        product: productId
    });

    if (alreadyReviewed) {
        res.status(400);
        throw new Error('Product already reviewed');
    }

    const review = new Review({
        user: req.user._id,
        product: productId,
        rating: Number(rating),
        comment
    });

    const createdReview = await review.save();
    await updateProductRating(productId);

    res.status(201).json(createdReview);
});

// Get reviews for a product
const getProductReviews = asyncHandler(async (req, res) => {
    const pageSize = 5;
    const page = Number(req.query.pageNumber) || 1;

    const count = await Review.countDocuments({ product: req.params.id });
    const reviews = await Review.find({ product: req.params.id })
        .populate('user', 'username')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
        reviews,
        page,
        pages: Math.ceil(count / pageSize),
        count
    });
});

// Get all reviews with filtering (Admin)
const getReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, product, user, rating } = req.query;

    const query = {};
    if (product) query.product = product;
    if (user) query.user = user;
    if (rating) query.rating = rating;

    const reviews = await Review.find(query)
        .populate('user', 'username')
        .populate('product', 'name')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

    const count = await Review.countDocuments(query);

    res.json({
        reviews,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalReviews: count
    });
});

// Delete a review
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    if (req.user.userType !== 'admin' && review.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this review');
    }

    await review.remove();

    await updateProductRating(review.product);

    res.json({ message: 'Review removed' });
});

// update product rating
const updateProductRating = async (productId) => {
    const stats = await Review.aggregate([
        { $match: { product: productId } },
        { $group: { _id: '$product', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]);

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            rating: stats[0].avgRating,
            numReviews: stats[0].nRating
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            rating: 0,
            numReviews: 0
        });
    }
};

export {
    createReview,
    getProductReviews,
    getReviews,
    deleteReview
};