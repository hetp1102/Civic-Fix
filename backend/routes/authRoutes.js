const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * POST /api/auth/google
 * Body: { credential } - the ID token returned by Google Identity Services
 * on the frontend (see components/GoogleSignInButton.js).
 *
 * This is the ONLY way citizen accounts are created - there is no separate
 * "register" form, matching the "register or login with Google" requirement.
 * Officer and admin accounts are provisioned internally (see seedAdmin.js and
 * POST /api/admin/officers), never through public self-registration.
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Missing Google credential.' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email_verified) {
      return res.status(401).json({ message: 'Google account email is not verified.' });
    }

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        googleId: payload.sub,
        avatar: payload.picture,
        role: 'citizen',
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.avatar = user.avatar || payload.picture;
      await user.save();
    }

    if (user.role !== 'citizen') {
      // Officers/admins should not authenticate through the public Google button
      return res.status(403).json({ message: 'This sign-in method is for citizens only.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Email/password login, used by officers and admins (accounts created
 * internally by an admin - see routes/adminRoutes.js).
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'This account has been disabled.' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me - current logged in user
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = router;


/**
 * POST /api/auth/citizen-login
 * Email/password login specifically for citizens.
 */
router.post('/citizen-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email/User ID and password are required.',
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid email/User ID or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'This account has been disabled.',
      });
    }

    if (user.role !== 'citizen') {
      return res.status(403).json({
        message: 'This login is only for citizen accounts.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);

    res.json({
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Citizen login failed. Please try again.',
    });
  }
});