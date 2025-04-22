import express from 'express';
import {
  loginUser,
  registerUser,
  registerCompanyOwner,
  adminLogin
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/register-company-owner', protect, admin, registerCompanyOwner);
router.post('/admin/login', adminLogin);

export default router;