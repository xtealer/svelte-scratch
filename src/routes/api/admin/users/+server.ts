import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin, handleAuthError } from '$lib/server/auth';
import { createUser, getAllUsers, updateUser, changePassword, getUserById } from '$lib/server/db/users';
import { ObjectId } from 'mongodb';

// GET - List all users (admin/super only)
// Admin users cannot see super admins
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const currentUser = requireAdmin(cookies);

    const users = await getAllUsers();

    // Filter users based on current user's role
    // Admin users cannot see super admins
    const filteredUsers = currentUser.role === 'super'
      ? users
      : users.filter(u => u.role !== 'super');

    // Remove passwords from response
    const safeUsers = filteredUsers.map(u => ({
      _id: u._id?.toString(),
      username: u.username,
      name: u.name,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }));

    return json({ users: safeUsers, currentUserRole: currentUser.role });
  } catch (error) {
    return handleAuthError(error);
  }
};

// POST - Create new user
// super: can create admin and seller
// admin: can only create seller
// seller: cannot create users
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const currentUser = requireAdmin(cookies);

    const { username, password, name, role } = await request.json();

    if (!username || !password || !name || !role) {
      return json({ error: 'All fields required' }, { status: 400 });
    }

    // Validate role based on current user's role
    const allowedRoles: string[] = [];

    if (currentUser.role === 'super') {
      // Super admin can create admin and seller
      allowedRoles.push('admin', 'seller');
    } else if (currentUser.role === 'admin') {
      // Admin can only create seller
      allowedRoles.push('seller');
    }
    // Sellers cannot create users (already blocked by requireAdmin)

    if (!allowedRoles.includes(role)) {
      if (currentUser.role === 'admin' && role === 'admin') {
        return json({ error: 'Only super admins can create admin users' }, { status: 403 });
      }
      return json({ error: 'Invalid role' }, { status: 400 });
    }

    const user = await createUser(
      username,
      password,
      role,
      name,
      new ObjectId(currentUser.userId)
    );

    return json({
      success: true,
      user: {
        _id: user._id?.toString(),
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    // Handle specific business logic error
    const message = error instanceof Error ? error.message : '';
    if (message === 'Username already exists') {
      return json({ error: message }, { status: 400 });
    }
    return handleAuthError(error);
  }
};

// PATCH - Update user (admin/super only)
export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    const currentUser = requireAdmin(cookies);

    const { userId, name, active, role, newPassword } = await request.json();

    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 });
    }

    // Get target user to check permissions
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Permission checks
    // Cannot modify super unless you are super
    if (targetUser.role === 'super' && currentUser.role !== 'super') {
      return json({ error: 'Cannot modify super admin' }, { status: 403 });
    }

    // Admin cannot modify other admins
    if (targetUser.role === 'admin' && currentUser.role === 'admin' && targetUser._id?.toString() !== currentUser.userId) {
      return json({ error: 'Cannot modify other admin users' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (active !== undefined) updates.active = active;

    // Role change restrictions
    if (role !== undefined) {
      if (currentUser.role === 'super') {
        // Superadmin can change to any role except super
        if (['admin', 'seller'].includes(role)) {
          updates.role = role;
        }
      } else if (currentUser.role === 'admin') {
        // Admin can only set seller role
        if (role === 'seller') {
          updates.role = role;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateUser(userId, updates as { name?: string; active?: boolean; role?: 'admin' | 'seller' });
    }

    if (newPassword) {
      await changePassword(userId, newPassword);
    }

    return json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
};
