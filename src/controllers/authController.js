const authService = require('../services/authService');
const { validationResult } = require('express-validator');

const authController = {
  // Register new user
  register: async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, name, password, role } = req.body;
      
      const result = await authService.register({
        email,
        name,
        password,
        role
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  login: async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      
      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid email or password' || 
          error.message === 'Account is deactivated') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  // Get user profile
  getProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await authService.getProfile(userId);

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user
      });
    } catch (error) {
      if (error.message === 'User not found' || 
          error.message === 'Account is deactivated') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { name, email } = req.body;
      
      const updatedUser = await authService.updateProfile(userId, { name, email });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      if (error.message === 'Email already in use by another user') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  // Change password
  changePassword: async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      const result = await authService.changePassword(userId, {
        currentPassword,
        newPassword
      });

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  // Refresh token
  refreshToken: async (req, res, next) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const result = await authService.refreshToken(token);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid or expired token' || 
          error.message === 'User not found or inactive') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  // Logout (client-side token removal, but we can log the action)
  logout: async (req, res, next) => {
    try {
      // In JWT, logout is typically handled client-side by removing the token
      // But we can perform server-side actions like logging the logout event
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;