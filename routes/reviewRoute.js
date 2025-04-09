import express from 'express';
import { auth } from '../middleware/auth.js';
import { addReview } from '../controllers/reviewController.js';

const reviewRouter = express.Router();

router.post("/", auth, addReview);
export default reviewRouter;