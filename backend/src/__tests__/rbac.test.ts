import { requireRole, UserRole } from '../middleware/rbac';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

describe('requireRole RBAC middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should return 401 UNAUTHORIZED if req.user is missing', () => {
    const middleware = requireRole('admin', 'super_admin');
    
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'UNAUTHORIZED',
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 FORBIDDEN if the user does not have an allowed role', () => {
    mockReq.user = {
      id: 'user-1',
      email: 'viewer@chpmi.org',
      fullName: 'Viewer User',
      role: 'viewer',
      organizationId: 'org-1',
    };

    const middleware = requireRole('admin', 'super_admin');
    
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'FORBIDDEN',
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if the user has an allowed role', () => {
    mockReq.user = {
      id: 'user-2',
      email: 'admin@chpmi.org',
      fullName: 'Admin User',
      role: 'admin',
      organizationId: 'org-1',
    };

    const middleware = requireRole('admin', 'super_admin');
    
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});
