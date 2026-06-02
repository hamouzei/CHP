import { Router } from 'express';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import prisma from '../config/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAction, logActionFromReq } from '../services/audit';
import * as jwt from 'jsonwebtoken';
import { getKeys } from '../config/keys';

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

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  countryCode: z.string().length(3).toUpperCase().optional(),
  region: z.string().optional(),
  organizationType: z.enum(['national', 'subnational', 'partner']).optional(),
  isActive: z.boolean().optional(),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  password: z.string().min(10, 'Password must be at least 10 characters long')
    .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter' })
    .refine((val) => /[a-z]/.test(val), { message: 'Password must contain at least one lowercase letter' })
    .refine((val) => /[0-9]/.test(val), { message: 'Password must contain at least one number' })
    .refine((val) => /[^A-Za-z0-9]/.test(val), { message: 'Password must contain at least one special character' })
    .optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'assessor', 'reviewer', 'viewer']),
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

// PATCH /organizations/:id - Edit/suspend organization
router.patch('/organizations/:id', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const body = updateOrgSchema.parse(req.body);

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: body,
    });

    await logAction({
      userId: user.id,
      organizationId: null,
      action: 'ORGANIZATION_UPDATE',
      entityType: 'organization',
      entityId: org.id,
      previousValue: org,
      newValue: updated,
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Validation failed', fields: error.errors });
    }
    console.error('Update organization error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update organization' });
  }
});

// DELETE /organizations/:id - Delete organization
router.delete('/organizations/:id', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
    }

    await prisma.organization.delete({ where: { id } });

    await logAction({
      userId: user.id,
      organizationId: null,
      action: 'ORGANIZATION_DELETE',
      entityType: 'organization',
      entityId: id,
      previousValue: org,
    });

    return res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to delete organization' });
  }
});

// PATCH /users/profile - Update user profile
router.patch('/users/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const body = updateProfileSchema.parse(req.body);

    const currentUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!currentUser) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    const updateData: any = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.password !== undefined) {
      const isSamePassword = await bcrypt.compare(body.password, currentUser.passwordHash);
      if (isSamePassword) {
        return res.status(400).json({
          error: 'PASSWORD_REUSE',
          message: 'New password cannot be the same as your current password.',
        });
      }
      updateData.passwordHash = await bcrypt.hash(body.password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await logAction({
      userId: user.id,
      organizationId: user.organizationId,
      action: 'USER_PROFILE_UPDATE',
      entityType: 'user',
      entityId: user.id,
      previousValue: { fullName: currentUser.fullName },
      newValue: { fullName: updated.fullName },
    });

    return res.json({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      organizationId: updated.organizationId,
      isActive: updated.isActive,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Validation failed', fields: error.errors });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update user profile' });
  }
});

// DELETE /users/:id - Delete user (super_admin only)
router.delete('/users/:id', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    if (id === user.id) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'You cannot delete your own account' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    await logAction({
      userId: user.id,
      organizationId: user.organizationId,
      action: 'USER_DELETE',
      entityType: 'user',
      entityId: id,
      previousValue: { email: targetUser.email, fullName: targetUser.fullName, role: targetUser.role },
    });

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to delete user' });
  }
});

// PATCH /users/:id/role - Promote/demote role
router.patch('/users/:id/role', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const body = updateRoleSchema.parse(req.body);

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: body.role },
    });

    await logAction({
      userId: user.id,
      organizationId: user.organizationId,
      action: 'USER_ROLE_UPDATE',
      entityType: 'user',
      entityId: id,
      previousValue: { role: targetUser.role },
      newValue: { role: updated.role },
    });

    return res.json({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      organizationId: updated.organizationId,
      isActive: updated.isActive,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Validation failed', fields: error.errors });
    }
    console.error('Update role error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update user role' });
  }
});

// POST /users/:id/impersonate - Impersonate user
router.post('/users/:id/impersonate', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const adminUser = req.user!;
    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Active target user not found' });
    }

    const { privateKey } = getKeys();
    const accessToken = jwt.sign(
      {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        role: targetUser.role,
        organizationId: targetUser.organizationId,
        impersonatedBy: adminUser.id,
      },
      privateKey,
      { algorithm: 'RS256', expiresIn: '15m' }
    );

    await logAction({
      userId: adminUser.id,
      organizationId: adminUser.organizationId,
      action: 'USER_IMPERSONATION_START',
      entityType: 'user',
      entityId: targetUser.id,
      newValue: { impersonatedEmail: targetUser.email },
    });

    return res.json({
      accessToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        role: targetUser.role,
        organizationId: targetUser.organizationId,
        organizationName: targetUser.organization?.name || null,
      },
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to impersonate user' });
  }
});

export default router;

