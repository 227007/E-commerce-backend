import express from 'express';
import {
    getSalesReport,
    getCompanyPerformanceReport
} from '../controllers/reportController.js';
import { protect, admin, companyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/sales')
    .get(protect, companyAdmin, getSalesReport);

router.route('/companies')
    .get(protect, admin, getCompanyPerformanceReport);

export default router;