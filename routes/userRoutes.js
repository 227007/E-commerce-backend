import express from 'express';
import { 
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDashboardStats
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getUsers);

router.route('/:id')
    .get(protect, getUserById)
    .put(protect, updateUser)
    .delete(protect, admin, deleteUser);

router.route('/dashboard/stats')
    .get(protect, admin, getDashboardStats);

export default router;