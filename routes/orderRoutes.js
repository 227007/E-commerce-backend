import express from 'express';
import { 
    createOrder,
    getOrderById,
    updateOrderToPaid,
    updateOrderStatus,
    getMyOrders,
    getCompanyOrders,
    getOrders,
    addOrderNote
} from '../controllers/orderController.js';
import { protect, admin, companyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getOrders)
    .post(protect, createOrder);

router.route('/myorders').get(protect, getMyOrders);
router.route('/company').get(protect, companyAdmin, getCompanyOrders);

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/status').put(protect, companyAdmin, updateOrderStatus);
router.route('/:id/notes').post(protect, companyAdmin, addOrderNote);

export default router;