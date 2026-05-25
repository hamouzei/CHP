import { Router } from 'express';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import prisma from '../config/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAction } from '../services/audit';

const router = Router();

// Zod validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(['admin', 'assessor', 'reviewer', 'viewer']),
  password: z.string().min(10, 'Password must be at least 10 characters long')
    .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter' })
    .refine((val) => /[a-z]/.test(val), { message: 'Password must contain at least one lowercase letter' })
    .refine((val) => /[0-9]/.test(val), { message: 'Password must contain at least one number' })
    .refine((val) => /[^A-Za-z0-9]/.test(val), { message: 'Password must contain at least one special character' }),
  organizationId: z.string().uuid().optional(),
});

const createOrgSchema = z.object({
  name: z.string().min(2),
  countryCode: z.string().length(3).toUpperCase().optional(),
  region: z.string().optional(),
  organizationType: z.enum(['national', 'subnational', 'partner']).default('national'),
});

// GET /users - List users in organization (or all for super_admin)
router.get('/users', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    let whereClause = {};

    if (user.role !== 'super_admin') {
      if (!user.organizationId) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'User not associated with an organization' });
      }
      whereClause = { organizationId: user.organizationId };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { organization: true },
      orderBy: { fullName: 'asc' },
    });

    // Sanitized response (no password hashes)
    const sanitized = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      organizationId: u.organizationId,
      organizationName: u.organization?.name || null,
      createdAt: u.createdAt,
    }));

    return res.json(sanitized);
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch users list' });
  }
});

// POST /users - Invite/Create user
router.post('/users', authenticate, requireRole('admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const body = createUserSchema.parse(req.body);

    let organizationId = user.organizationId;
    if (user.role === 'super_admin') {
      if (!body.organizationId) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'organizationId is required for super_admin invitations' });
      }
      organizationId = body.organizationId;
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'No organization scope defined' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return res.status(409).json({ error: 'ALREADY_EXISTS', message: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        role: body.role,
        organizationId,
        isActive: true,
      },
    });

    await logAction({
      userId: user.id,
      organizationId: user.organizationId,
      action: 'USER_CREATE',
      entityType: 'user',
      entityId: newUser.id,
      newValue: { email: newUser.email, role: newUser.role },
    });

    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      organizationId: newUser.organizationId,
      isActive: newUser.isActive,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Validation failed', fields: error.errors });
    }
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create user' });
  }
});

// GET /organizations - List all organizations (super_admin only)
router.get('/organizations', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json(orgs);
  } catch (error) {
    console.error('Fetch organizations error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch organizations' });
  }
});

// POST /organizations - Create organization (super_admin only)
router.post('/organizations', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const body = createOrgSchema.parse(req.body);

    const org = await prisma.organization.create({
      data: {
        name: body.name,
        countryCode: body.countryCode,
        region: body.region,
        organizationType: body.organizationType,
        isActive: true,
      },
    });

    await logAction({
      userId: user.id,
      organizationId: null,
      action: 'ORGANIZATION_CREATE',
      entityType: 'organization',
      entityId: org.id,
      newValue: org,
    });

    return res.status(201).json(org);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Validation failed', fields: error.errors });
    }
    console.error('Create organization error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create organization' });
  }
});

export default router;
