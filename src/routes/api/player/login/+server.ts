import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  validatePlayerLogin,
  generatePlayerToken,
  isEmailOnlyUser,
  generate2FACode
} from '$lib/server/db/playerUsers';
import { send2FACode } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await validatePlayerLogin(email, password);

    if (!user) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if user is email-only (requires 2FA)
    if (isEmailOnlyUser(user)) {
      // Generate and send 2FA code
      const code = await generate2FACode(user._id!);

      if (!code) {
        return json({ error: 'Failed to generate verification code' }, { status: 500 });
      }

      // Send code via email
      const sent = await send2FACode(user.email!, code);

      if (!sent) {
        console.error('Failed to send 2FA email to:', user.email);
        // Still continue - code is logged in development
      }

      return json({
        requires2FA: true,
        userId: user._id?.toString(),
        email: user.email,
        message: 'Verification code sent to your email'
      });
    }

    // User has MetaMask linked, no 2FA required
    const token = generatePlayerToken(user);

    return json({
      success: true,
      token,
      user: {
        odSI: user._id?.toString(),
        email: user.email,
        fullName: user.fullName,
        country: user.country,
        preferredLanguage: user.preferredLanguage,
        metamaskAddress: user.metamaskAddress,
        usdtBalance: user.usdtBalance ?? 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
