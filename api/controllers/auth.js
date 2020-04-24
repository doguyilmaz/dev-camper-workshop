const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/async');

const User = require('../models/User');

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
	const { name, email, password, role } = req.body;

	// Create user
	const user = await User.create({
		name,
		email,
		password,
		role,
	});

	sendTokenResponse(user, 200, res);
});

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
	const { email, password } = req.body;

	// Validate email & password
	if (!email || !password) {
		return next(new ErrorResponse('Email and password is required.', 400));
	}

	// Check if user exists
	const user = await User.findOne({ email }).select('+password');
	if (!user) {
		return next(new ErrorResponse('User not found.', 401));
	}

	// Check if password match
	const isMatch = await user.matchPassword(password);
	if (!isMatch) {
		return next(new ErrorResponse('Password is wrong.', 401));
	}

	sendTokenResponse(user, 200, res);
});

// Get Token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
	// Create Token // Comes from User model as methods not statics
	const token = user.getSignedJWTToken();

	const options = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRE_TIME * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === 'production') {
		options.secure = true;
	}

	res.status(statusCode).cookie('token', token, options).json({
		success: true,
		token,
	});
};