import asyncHandler from './../middleware/asyncHandler.js';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  // Get data from request body
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    // Return user data and token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    // Return error if user does not exist or password does not match
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  // Get data from request body
  const { name, email, password } = req.body;

  // Find user by email
  const userExists = await User.findOne({ email });

  // Check if user exists
  if (userExists) {
    // Return error if user exists
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Check if user was created
  if (user) {
    generateToken(res, user._id);
    // Return user data and token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    // Return error if user was not created
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Logout user & clear cookie
// @route   GET /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  // Clear cookie
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  // Return message
  res.status(200).json({ message: 'User logged out' });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  // Find user by id
  const user = await User.findById(req.user._id);

  // Check if user exists
  if (user) {
    // Return user data
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    // Return error if user does not exist
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  // Find user by id
  const user = await User.findById(req.user._id);

  // Check if user exists
  if (user) {
    // Update user data
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    // Check if password was provided
    if (req.body.password) {
      // Set new password
      user.password = req.body.password;
    }

    // Save user
    const updatedUser = await user.save();

    // Return user data and token
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: user.isAdmin,
    });
  } else {
    // Return error if user does not exist
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  // Find all users
  const users = await User.find({});
  // Return users
  res.status(200).json(users);
});

// @desc    Get user by id
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  // Find user by id
  const user = await User.findById(req.params.id).select('-password');

  // Check if user exists
  if (user) {
    // Return user data
    res.status(200).json(user);
  } else {
    // Return error if user does not exist
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  // Find user by id
  const user = await User.findById(req.params.id);

  // Check if user exists
  if (user) {
    if (user.isAdmin) {
      // Return error if user is admin
      res.status(400);
      throw new Error('Cannot delete admin user');
    }
    // Delete user
    await user.deleteOne({ _id: user._id });
    // Return message
    res.status(200).json({ message: 'User deleted successfully' });
  } else {
    // Return error if user does not exist
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  // Find user by id
  const user = await User.findById(req.params.id);

  // Check if user exists
  if (user) {
    // Update user data
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);

    // Save user
    const updatedUser = await user.save();

    // Return user data
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    // Return error if user does not exist
    res.status(404);
    throw new Error('User not found');
  }
});

export {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
};
