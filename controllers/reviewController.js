import Review from '../models/reviewModel.js';

// Add a new review
const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const review = await Review.create({
            productId,
            userId: req.user._id,
            rating,
            comment
        });
        res.status(201).json({ success: true, review });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addReview };