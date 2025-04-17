import express from 'express';
import { loginUser, registerUser, adminLogin, googleLogin, googleCallback, facebookLogin, facebookCallback } from '../controllers/userController.js';
import passport from 'passport';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin/login', adminLogin);
userRouter.get('/auth/google', googleLogin);
userRouter.get('/auth/google/callback', googleCallback);
userRouter.get('/auth/facebook', facebookLogin);
userRouter.get('/auth/facebook/callback', facebookCallback);

export default userRouter;