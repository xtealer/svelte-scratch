import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPlayerToken, getPlayerUserById, verify2FACode, isEmailOnlyUser } from '$lib/server/db/playerUsers';

// POST - Verify 2FA code for withdrawal
export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyPlayerToken(token);
    if (!payload) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return json({ error: 'Invalid verification code format' }, { status: 400 });
    }

    // Get user
    const user = await getPlayerUserById(payload.odSI);
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Only email-only users require 2FA verification for withdrawals
    if (!isEmailOnlyUser(user)) {
      return json({
        verified: true,
        message: 'MetaMask users do not require 2FA verification'
      });
    }

    // Verify the 2FA code
    const result = await verify2FACode(user._id!, code);

    if (!result.valid) {
      return json({ error: result.error || 'Invalid verification code' }, { status: 400 });
    }

    return json({
      verified: true,
      message: 'Verification successful'
    });
  } catch (error) {
    console.error('Withdrawal 2FA verification error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
