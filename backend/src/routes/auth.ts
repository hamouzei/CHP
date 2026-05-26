import { Router, Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getKeys } from '../config/keys';

const router = Router();

// In-memory rate limiting map
const authAttempts = new Map<string, { count: number; firstAttempt: number }>();

function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxAttempts = 10;

  const attempts = authAttempts.get(ip);
  if (!attempts) {
    authAttempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (now - attempts.firstAttempt > windowMs) {
    // Reset window
    authAttempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (attempts.count >= maxAttempts) {
    return res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again after a minute.',
    });
  }

  attempts.count++;
  next();
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(10, 'Password must be at least 10 characters long')
    .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter' })
    .refine((val) => /[a-z]/.test(val), { message: 'Password must contain at least one lowercase letter' })
    .refine((val) => /[0-9]/.test(val), { message: 'Password must contain at least one number' })
    .refine((val) => /[^A-Za-z0-9]/.test(val), { message: 'Password must contain at least one special character' }),
});

// POST /auth/login
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials or inactive account' });
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        error: 'LOCKED',
        message: `Account temporarily locked. Please try again after ${user.lockedUntil.toISOString()}`,
      });
    }

    const passwordMatch = await bcrypt.compare(body.password, user.passwordHash);

    if (!passwordMatch) {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;
      
      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30-minute lockout
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil,
        },
      });

      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate asymmetric RS256 tokens
    const { privateKey } = getKeys();
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
      },
      privateKey,
      { algorithm: 'RS256', expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      privateKey,
      { algorithm: 'RS256', expiresIn: '7d' }
    );

    // Save refresh token details in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        action: 'USER_LOGIN',
        entityType: 'user',
        entityId: user.id,
        newValue: { email: user.email, timestamp: new Date() },
      },
    });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid inputs provided', fields: error.errors });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An error occurred during login' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Refresh token missing' });
  }

  try {
    const { publicKey, privateKey } = getKeys();
    const decoded = jwt.verify(refreshToken, publicKey, { algorithms: ['RS256'] }) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or inactive user' });
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
      },
      privateKey,
      { algorithm: 'RS256', expiresIn: '15m' }
    );

    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Refresh token expired or invalid' });
  }
});

// POST /auth/logout
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    res.clearCookie('refreshToken');
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          organizationId: req.user.organizationId,
          action: 'USER_LOGOUT',
          entityType: 'user',
          entityId: req.user.id,
        },
      });
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An error occurred during logout' });
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No active session' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { organization: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User profile not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An error occurred fetching profile' });
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', authRateLimiter, async (req, res) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      // Return 200 to prevent user enumeration
      return res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }

    // Generate a reset token valid for 1 hour
    const { privateKey } = getKeys();
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'password_reset' },
      privateKey,
      { algorithm: 'RS256', expiresIn: '1h' }
    );

    // In a real application, we would email this token. 
    // Here we log it to console/stub for development.
    console.log(`✉️ [SMTP Mock] Password reset requested for ${user.email}.`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Reset Link: http://localhost:3000/reset-password?token=${resetToken}`);

    // Log the audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        action: 'PASSWORD_RESET_REQUEST',
        entityType: 'user',
        entityId: user.id,
      },
    });

    return res.json({ message: 'If the email exists, a password reset link has been sent.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid inputs provided', fields: error.errors });
    }
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An error occurred processing request' });
  }
});

// POST /auth/reset-password
router.post('/reset-password', authRateLimiter, async (req, res) => {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const { publicKey } = getKeys();

    let decoded: any;
    try {
      decoded = jwt.verify(body.token, publicKey, { algorithms: ['RS256'] });
    } catch (err) {
      return res.status(400).json({ error: 'INVALID_TOKEN', message: 'Password reset token is invalid or expired' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'INVALID_TOKEN', message: 'Invalid token purpose' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found or inactive' });
    }

    // Check if new password is same as current password (history constraint length of 1)
    const isSamePassword = await bcrypt.compare(body.newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'PASSWORD_REUSE',
        message: 'New password cannot be the same as your current password.',
      });
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        action: 'PASSWORD_RESET_COMPLETE',
        entityType: 'user',
        entityId: user.id,
      },
    });

    return res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid inputs provided', fields: error.errors });
    }
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An error occurred resetting password' });
  }
});

export default router;
