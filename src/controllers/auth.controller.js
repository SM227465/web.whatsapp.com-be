import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/userModel.js';
import { catchAsync } from '../utils/catch-async.util.js';
import { AppError } from '../utils/error.util.js';
import { generateToken } from '../utils/token.util.js';

export const register = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    countryCode,
    phoneNumber,
    password,
    confirmPassword,
    picture,
  } = req.body;

  const user = await User.findOne({ email: email });

  if (user) {
    return next(new AppError(`A user exists with this email; if it's you, please login.`, 400));
  }

  const newUser = await User.create({
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email,
    countryCode,
    phoneNumber,
    password,
    confirmPassword,
    picture,
  });

  const accessToken = await generateToken(newUser._id, 'access');
  const refreshToken = await generateToken(newUser._id, 'refresh');

  newUser.password = undefined;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    path: '/api/v1/auth/refresh-token',
    maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
  });

  res.status(201).json({
    success: true,
    message: 'Your account has been created successfully.',
    token: {
      access: accessToken,
      refresh: refreshToken,
    },
    user: newUser,
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide an email and password.', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const accessToken = await generateToken(user._id, 'access');
  const refreshToken = await generateToken(user._id, 'refresh');

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    path: '/api/v1/auth/refresh-token',
    maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
  });

  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Login success',
    token: {
      access: accessToken,
      refresh: refreshToken,
    },
    user: user,
  });
});

export const logout = async (req, res, next) => {
  /*
  try {
    res.clearCookie('refreshtoken', { path: '/api/v1/auth/refresh-token' });
    res.json({
      message: 'logged out !',
    });
  } catch (error) {
    next(error);
  }

  */
};

export const refreshToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError('No refresh token found, Please login', 401));
  }

  const decoded = await promisify(jwt.verify)(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  if (decoded.type !== 'refresh') {
    return next(new AppError('Type of token is not a refresh token', 400));
  }

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist', 401));
  }

  const accessToken = await generateToken(currentUser._id, 'access');

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    token: {
      access: accessToken,
    },
  });
});

export const protect = catchAsync(async (req, res, next) => {
  let accessToken;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    accessToken = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    accessToken = req.cookies.accessToken;
  }

  if (!accessToken) {
    return next(new AppError('You are not logged in! Please login to get access', 401));
  }

  const decoded = await promisify(jwt.verify)(accessToken, process.env.ACCESS_TOKEN_SECRET);

  if (decoded.type !== 'access') {
    return next(new AppError('Type of token is not an access token', 400));
  }

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist', 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please login again', 401));
  }

  req.user = currentUser;
  next();
});
