import { json, type Cookies, type RequestEvent } from '@sveltejs/kit';
import { verifyToken } from './db/users';
import type { UserRole } from './db/types';

export interface AuthUser {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
}

// Auth error class for consistent error handling
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Get authenticated user from cookies (returns null if not authenticated)
export function getAuthUser(cookies: Cookies): AuthUser | null {
  const token = cookies.get('admin_token');
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return decoded;
}

// Require authentication - throws AuthError if not authenticated
export function requireAuth(cookies: Cookies): AuthUser {
  const user = getAuthUser(cookies);
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

// Require admin or super role - throws AuthError if not authorized
export function requireAdmin(cookies: Cookies): AuthUser {
  const user = requireAuth(cookies);
  if (!isAdminOrSuper(user)) {
    throw new AuthError('Admin access required', 403);
  }
  return user;
}

// Require super admin role - throws AuthError if not authorized
export function requireSuperAdmin(cookies: Cookies): AuthUser {
  const user = requireAuth(cookies);
  if (user.role !== 'super') {
    throw new AuthError('Super admin access required', 403);
  }
  return user;
}

// Helper to check if user is admin or super
export function isAdminOrSuper(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'super';
}

// Standardized error response handler
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return json({ error: error.message }, { status: error.statusCode });
  }

  const message = error instanceof Error ? error.message : 'Server error';

  // Handle legacy error messages for backwards compatibility
  if (message === 'Unauthorized') {
    return json({ error: message }, { status: 401 });
  }
  if (message === 'Admin access required' || message === 'Super admin access required') {
    return json({ error: message }, { status: 403 });
  }

  console.error('API Error:', error);
  return json({ error: 'Server error' }, { status: 500 });
}

// Type for API handler functions
type ApiHandler<T = unknown> = (event: RequestEvent, user: AuthUser) => Promise<T>;

// Wrapper for authenticated API routes - provides consistent auth and error handling
export function withAuth<T>(handler: ApiHandler<T>) {
  return async (event: RequestEvent) => {
    try {
      const user = requireAuth(event.cookies);
      return await handler(event, user);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

// Wrapper for admin-only API routes
export function withAdmin<T>(handler: ApiHandler<T>) {
  return async (event: RequestEvent) => {
    try {
      const user = requireAdmin(event.cookies);
      return await handler(event, user);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

// Wrapper for super admin-only API routes
export function withSuperAdmin<T>(handler: ApiHandler<T>) {
  return async (event: RequestEvent) => {
    try {
      const user = requireSuperAdmin(event.cookies);
      return await handler(event, user);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}
