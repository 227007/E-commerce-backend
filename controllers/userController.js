import validator from "validator";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import userModel from "../models/userModel.js";
import passport from 'passport';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import { Strategy as FacebookStrategy } from 'passport-facebook';

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Route For User Login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isOAuth) {
            return res.status(400).json({
                success: false,
                message: "This account was registered via social media. Please use the appropriate login method."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = createToken(user._id);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// Route For User Register
const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Email already in use"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email"
            });
        }

        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters including uppercase, lowercase, number, and symbol"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            username,
            email,
            password: hashedPassword
        });

        const user = await newUser.save();
        const token = createToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// Route For Admin Login 
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const admin = await userModel.findOne({
            email,
            role: 'admin'
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = createToken(admin._id);
        res.json({
            success: true,
            token,
            user: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// Google OAuth Configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await userModel.findOne({ email: profile.emails[0].value });

            if (!user) {
                user = new userModel({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    password: '',
                    isOAuth: true,
                    googleId: profile.id
                });
                await user.save();
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

// Facebook OAuth Configuration
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails']
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            if (!profile.emails || !profile.emails[0]) {
                return done(new Error("No email associated with Facebook account"), null);
            }

            let user = await userModel.findOne({ email: profile.emails[0].value });

            if (!user) {
                user = new userModel({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    password: '',
                    isOAuth: true,
                    facebookId: profile.id
                });
                await user.save();
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

// Google OAuth Login
const googleLogin = passport.authenticate('google', {
    scope: ['profile', 'email']
});

// Google OAuth Callback
const googleCallback = (req, res, next) => {
    passport.authenticate('google', (err, user) => {
        if (err || !user) {
            return res.redirect('/login?error=auth_failed');
        }

        const token = createToken(user._id);
        res.redirect(`/?token=${token}`);
    })(req, res, next);
};

// Facebook OAuth Login
const facebookLogin = passport.authenticate('facebook', {
    scope: ['email']
});

// Facebook OAuth Callback
const facebookCallback = (req, res, next) => {
    passport.authenticate('facebook', (err, user) => {
        if (err || !user) {
            return res.redirect('/login?error=auth_failed');
        }

        const token = createToken(user._id);
        res.redirect(`/?token=${token}`);
    })(req, res, next);
};

export {
    loginUser, registerUser, adminLogin, googleLogin, googleCallback, facebookLogin, facebookCallback
};