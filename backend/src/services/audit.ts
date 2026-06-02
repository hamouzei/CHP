import prisma from '../config/db';
import { Request } from 'express';

interface AuditParams {
  userId: string;
  organizationId: string | null;
  assessmentId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAction(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        organizationId: params.organizationId,
        assessmentId: params.assessmentId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        previousValue: params.previousValue,
        newValue: params.newValue,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Convenience wrapper that auto-extracts IP address and User-Agent from the request.
 * Use this in route handlers instead of logAction for automatic metadata capture.
 */
export async function logActionFromReq(req: Request, params: Omit<AuditParams, 'ipAddress' | 'userAgent'>) {
  return logAction({
    ...params,
    ipAddress: req.ip || req.socket?.remoteAddress || undefined,
    userAgent: req.headers['user-agent'] || undefined,
  });
}
