import type { Cookies } from '@sveltejs/kit';
import { verifyToken } from './db/users';
import type { UserRole } from './db/types';

export interface AuthUser {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
}

export function getAuthUser(cookies: Cookies): AuthUser | null {
  const token = cookies.get('admin_token');
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return decoded;
}

export function requireAuth(cookies: Cookies): AuthUser {
  const user = getAuthUser(cookies);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function requireAdmin(cookies: Cookies): AuthUser {
  const user = requireAuth(cookies);
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}
