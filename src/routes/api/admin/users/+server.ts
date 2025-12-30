import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { createUser, getAllUsers, updateUser, changePassword } from '$lib/server/db/users';
import { ObjectId } from 'mongodb';

// GET - List all users (admin only)
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    requireAdmin(cookies);

    const users = await getAllUsers();

    // Remove passwords from response
    const safeUsers = users.map(u => ({
      _id: u._id?.toString(),
      username: u.username,
      name: u.name,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }));

    return json({ users: safeUsers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    if (message === 'Unauthorized' || message === 'Admin access required') {
      return json({ error: message }, { status: 403 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};

// POST - Create new user (admin only)
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const admin = requireAdmin(cookies);

    const { username, password, name, role } = await request.json();

    if (!username || !password || !name || !role) {
      return json({ error: 'All fields required' }, { status: 400 });
    }

    if (!['admin', 'seller'].includes(role)) {
      return json({ error: 'Invalid role' }, { status: 400 });
    }

    const user = await createUser(
      username,
      password,
      role,
      name,
      new ObjectId(admin.userId)
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
    const message = error instanceof Error ? error.message : 'Server error';
    if (message === 'Username already exists') {
      return json({ error: message }, { status: 400 });
    }
    if (message === 'Unauthorized' || message === 'Admin access required') {
      return json({ error: message }, { status: 403 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};

// PATCH - Update user (admin only)
export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    requireAdmin(cookies);

    const { userId, name, active, role, newPassword } = await request.json();

    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (active !== undefined) updates.active = active;
    if (role !== undefined && ['admin', 'seller'].includes(role)) updates.role = role;

    if (Object.keys(updates).length > 0) {
      await updateUser(userId, updates as { name?: string; active?: boolean; role?: 'admin' | 'seller' });
    }

    if (newPassword) {
      await changePassword(userId, newPassword);
    }

    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    if (message === 'Unauthorized' || message === 'Admin access required') {
      return json({ error: message }, { status: 403 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};
