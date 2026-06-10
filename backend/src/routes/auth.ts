import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import {
  validateRegisterInput, validateLoginInput, validatePassword, validateFullName, validateEmail,
} from '../utils/validation';
import {
  signAccessToken, generateRefreshToken, storeRefreshToken, verifyRefreshToken,
  revokeRefreshToken, revokeAllUserTokens, formatAuthResponse,
} from '../utils/tokens';
import { dbErrorResponse } from '../utils/dbError';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, keyPrefix: 'auth' });

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    const validation = validateRegisterInput({ email, password, fullName });
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'student')
       RETURNING id, email, full_name, role, created_at`,
      [email.toLowerCase().trim(), passwordHash, fullName.trim()]
    );

    const user = result.rows[0];
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, fullName: user.full_name });
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    res.status(201).json(formatAuthResponse(user, accessToken, refreshToken));
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const validation = validateLoginInput({ email, password });
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const result = await query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, fullName: user.full_name });
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    res.json(formatAuthResponse(user, accessToken, refreshToken));
  } catch (err) {
    console.error('Login error:', err);
    const dbErr = dbErrorResponse(err);
    if (dbErr) return res.status(dbErr.status).json(dbErr.body);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const user = await verifyRefreshToken(refreshToken);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    await revokeRefreshToken(refreshToken);

    const accessToken = signAccessToken(user);
    const newRefreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, newRefreshToken);

    res.json(formatAuthResponse(
      { id: user.id, email: user.email, full_name: user.fullName, role: user.role },
      accessToken,
      newRefreshToken
    ));
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const errors: Record<string, string> = {};

    if (fullName !== undefined) {
      const nameErr = validateFullName(fullName);
      if (nameErr) errors.fullName = nameErr;
    }
    if (email !== undefined) {
      const emailErr = validateEmail(email);
      if (emailErr) errors.email = emailErr;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    if (email && email.toLowerCase().trim() !== req.user!.email) {
      const existing = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase().trim(), req.user!.id]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use', errors: { email: 'Email already in use' } });
      }
    }

    const result = await query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, full_name, role, created_at`,
      [fullName?.trim(), email?.toLowerCase().trim(), req.user!.id]
    );

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const passErr = validatePassword(newPassword);
    if (passErr) {
      return res.status(400).json({ error: 'Validation failed', errors: { newPassword: passErr } });
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect', errors: { currentPassword: 'Incorrect password' } });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, req.user!.id]);
    await revokeAllUserTokens(req.user!.id);

    res.json({ success: true, message: 'Password updated. Please sign in again on other devices.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
