import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, AuthRequest } from '../middleware/auth.js';

export async function signup(req: AuthRequest, res: Response) {
  try {
    const { username, email, password, fullName, preferredLanguage } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // Check existing email
    const existingEmail = await db.getUserByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Check existing username
    const existingUsername = await db.getUserByUsername(cleanUsername);
    if (existingUsername) {
      return res.status(400).json({ error: 'This username is already taken.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.createUser({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      fullName: fullName ? fullName.trim() : username,
      preferredLanguage: preferredLanguage || 'en'
    });

    const userId = newUser._id || newUser.id;

    // Generate JWT
    const token = jwt.sign(
      { userId, username: cleanUsername, email: cleanEmail },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        fullName: newUser.fullName,
        preferredLanguage: newUser.preferredLanguage
      }
    });
  } catch (error: any) {
    console.error('Error during signup:', error);
    return res.status(500).json({ error: error.message || 'Failed to create user account' });
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { identifier, email, password } = req.body;
    const loginTarget = (identifier || email || '').trim();

    if (!loginTarget || !password) {
      return res.status(400).json({ error: 'Please provide email/username and password.' });
    }

    // Find by email or username
    let user = await db.getUserByEmail(loginTarget);
    if (!user) {
      user = await db.getUserByUsername(loginTarget);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const userId = user._id || user.id;

    const token = jwt.sign(
      { userId, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.username,
        preferredLanguage: user.preferredLanguage || 'en'
      }
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: error.message || 'Failed to authenticate user' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    return res.json({
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.username,
        preferredLanguage: user.preferredLanguage || 'en',
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
}

export function logout(req: AuthRequest, res: Response) {
  return res.json({ success: true, message: 'Logged out successfully' });
}
