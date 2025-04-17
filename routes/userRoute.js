import express from 'express';
import { loginUser, registerUser, adminLogin, socialLogin } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/auth/social', socialLogin);
userRouter.post('/admin/login', adminLogin);

export default userRouter;