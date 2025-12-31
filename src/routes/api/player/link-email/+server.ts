import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPlayerToken, linkEmailToAccount, generatePlayerToken } from '$lib/server/db/playerUsers';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyPlayerToken(token);
    if (!payload) {
      return json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { email, password, fullName } = await request.json();

    // Validate email format
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return json({ error: 'Valid email required' }, { status: 400 });
    }

    // Validate password
    if (!password || password.length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Link email to account
    const updatedUser = await linkEmailToAccount(payload.odSI, email, password, fullName);

    // Generate new token with updated user data
    const newToken = generatePlayerToken(updatedUser);

    return json({
      success: true,
      token: newToken,
      user: {
        odSI: updatedUser._id?.toString(),
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        country: updatedUser.country,
        preferredLanguage: updatedUser.preferredLanguage,
        metamaskAddress: updatedUser.metamaskAddress
      }
    });
  } catch (error) {
    console.error('Link email error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return json({ error: message }, { status: 400 });
  }
};
