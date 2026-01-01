import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlayerUserById, generate2FACode, isEmailOnlyUser } from '$lib/server/db/playerUsers';
import { send2FACode } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await getPlayerUserById(userId);

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    if (!isEmailOnlyUser(user)) {
      return json({ error: '2FA not required for this user' }, { status: 400 });
    }

    // Generate and send new 2FA code
    const code = await generate2FACode(user._id!);

    if (!code) {
      return json({ error: 'Failed to generate verification code' }, { status: 500 });
    }

    // Send code via email
    const sent = await send2FACode(user.email!, code);

    if (!sent) {
      console.error('Failed to send 2FA email to:', user.email);
    }

    return json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Resend 2FA error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
