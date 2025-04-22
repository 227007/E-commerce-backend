import express from 'express';
import { 
    createReview,
    getProductReviews,
    getReviews,
    deleteReview
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(protect, createReview)
    .get(protect, admin, getReviews);

router.route('/product/:id')
    .get(getProductReviews);

router.route('/:id')
    .delete(protect, deleteReview);

export default router;