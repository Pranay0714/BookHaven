import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { JWT_SECRET } from '../config.js';
import { verifyManager } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/register', async (request, response) => {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: 'Send all required fields: name, email, password',
      });
    }

    if (password.length < 6) {
      return response.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return response.status(400).json({
        message: 'A manager with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'manager',
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return response.status(201).json({
      message: 'Manager registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return response.status(500).json({ message: error.message });
  }
});

// Route for Manager Login / Sign In
router.post('/login', async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({
        message: 'Send email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return response.status(400).json({
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return response.status(400).json({
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return response.status(200).json({
      message: 'Manager logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return response.status(500).json({ message: error.message });
  }
});

// Route to get currently logged in Manager info using token
router.get('/me', verifyManager, async (request, response) => {
  try {
    const user = await User.findById(request.user.id).select('-password');
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }
    return response.status(200).json({ user });
  } catch (error) {
    return response.status(500).json({ message: error.message });
  }
});

export default router;
