import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateLogin, generateToken, verifyToken, ensureAdminExists } from '$lib/server/db/users';
import { ensureGamesExist } from '$lib/server/db/games';

// POST - Login
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Ensure defaults exist
    await ensureAdminExists();
    await ensureGamesExist();

    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ error: 'Username and password required' }, { status: 400 });
    }

    const user = await validateLogin(username, password);

    if (!user) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user);

    // Set HTTP-only cookie
    cookies.set('admin_token', token, {
      path: '/',
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};

// GET - Check session / Get current user
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get('admin_token');

    if (!token) {
      return json({ authenticated: false }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      cookies.delete('admin_token', { path: '/' });
      return json({ authenticated: false }, { status: 401 });
    }

    return json({
      authenticated: true,
      user: {
        userId: decoded.userId,
        username: decoded.username,
        name: decoded.name,
        role: decoded.role
      }
    });
  } catch {
    return json({ authenticated: false }, { status: 401 });
  }
};

// DELETE - Logout
export const DELETE: RequestHandler = async ({ cookies }) => {
  cookies.delete('admin_token', { path: '/' });
  return json({ success: true });
};
