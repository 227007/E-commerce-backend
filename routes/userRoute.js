import express from 'express';
import { loginUser, registerUser, adminLogin, socialLogin, getCurrentUser, createCompanyOwner } from '../controllers/userController.js';
import authorize from '../middleware/authorize.js';
import authUser from '../middleware/auth.js';
const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/auth/social', socialLogin);
userRouter.post('/admin/login', adminLogin);
userRouter.get('/me', authUser, getCurrentUser);
userRouter.post('/company-owners', authUser, authorize(['admin']), createCompanyOwner);

export default userRouter;