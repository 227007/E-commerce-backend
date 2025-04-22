import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Company from '../models/Company.js';

// Login user/company owner
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Please enter email and password');
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is suspended, please contact support');
  }

  const token = generateToken(user._id, user.userType);
  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    userType: user.userType,
    companyId: user.companyId,
    token
  });
});

// Register new user
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, phone } = req.body;
  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please enter all required fields');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = await User.create({
    username,
    email,
    password,
    phone,
    userType: 'customer'
  });
  if (user) {
    const token = generateToken(user._id, user.userType);
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      userType: user.userType,
      token
    });
  } else {
    res.status(400);
    throw new Error('Error occurred while creating account');
  }
});

// Register new company owner (by admin)
const registerCompanyOwner = asyncHandler(async (req, res) => {
  const { username, email, password, phone, companyId } = req.body;
  if (!username || !email || !password || !companyId) {
    res.status(400);
    throw new Error('Please enter all required fields');
  }
  const company = await Company.findById(companyId);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = await User.create({
    username,
    email,
    password,
    phone,
    userType: 'company',
    companyId
  });

  if (user) {
    const token = generateToken(user._id, user.userType);
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      userType: user.userType,
      companyId: user.companyId,
      token
    });
  } else {
    res.status(400);
    throw new Error('Error occurred while creating account');
  }
});

// Admin login
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await User.findOne({ email, userType: 'admin' });
  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const token = generateToken(admin._id, admin.userType);
  res.json({
    _id: admin._id,
    username: admin.username,
    email: admin.email,
    userType: admin.userType,
    token
  });
});

// generate token
const generateToken = (id, userType) => {
  return jwt.sign(
    { id, userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

export {
  loginUser,
  registerUser,
  registerCompanyOwner,
  adminLogin
};