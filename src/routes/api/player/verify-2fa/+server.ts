import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verify2FACode, generatePlayerToken } from '$lib/server/db/playerUsers';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return json({ error: 'User ID and verification code required' }, { status: 400 });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return json({ error: 'Invalid verification code format' }, { status: 400 });
    }

    const result = await verify2FACode(userId, code);

    if (!result.valid || !result.user) {
      return json({ error: result.error || 'Invalid verification code' }, { status: 401 });
    }

    const token = generatePlayerToken(result.user);

    return json({
      success: true,
      token,
      user: {
        odSI: result.user._id?.toString(),
        email: result.user.email,
        fullName: result.user.fullName,
        country: result.user.country,
        preferredLanguage: result.user.preferredLanguage,
        metamaskAddress: result.user.metamaskAddress,
        usdtBalance: result.user.usdtBalance ?? 0
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
