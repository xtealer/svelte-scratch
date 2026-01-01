import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPlayerToken, getPlayerUserById, generate2FACode, isEmailOnlyUser } from '$lib/server/db/playerUsers';
import { send2FACodeForWithdrawal } from '$lib/server/email';

// POST - Request 2FA code for withdrawal
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

    const { amount } = await request.json();

    if (typeof amount !== 'number' || amount <= 0) {
      return json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get user to check if email-only
    const user = await getPlayerUserById(payload.odSI);
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has email (required for 2FA)
    if (!user.email) {
      return json({ error: 'No email associated with this account' }, { status: 400 });
    }

    // Check if user is email-only (no MetaMask) - only these users need 2FA for withdrawals
    if (!isEmailOnlyUser(user)) {
      return json({
        requires2FA: false,
        message: 'MetaMask users do not require 2FA for withdrawals'
      });
    }

    // Generate 2FA code
    const code = await generate2FACode(user._id!);
    if (!code) {
      return json({ error: 'Failed to generate verification code' }, { status: 500 });
    }

    // Send email with withdrawal context
    const sent = await send2FACodeForWithdrawal(user.email, code, amount);
    if (!sent) {
      return json({ error: 'Failed to send verification code' }, { status: 500 });
    }

    return json({
      success: true,
      requires2FA: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Withdrawal 2FA request error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
