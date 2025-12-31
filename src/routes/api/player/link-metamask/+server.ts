import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { linkMetamaskToAccount, verifyPlayerToken } from '$lib/server/db/playerUsers';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyPlayerToken(token);

    if (!decoded) {
      return json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { metamaskAddress } = await request.json();

    if (!metamaskAddress) {
      return json({ error: 'Metamask address required' }, { status: 400 });
    }

    // Validate address format (basic check)
    if (!metamaskAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return json({ error: 'Invalid Metamask address format' }, { status: 400 });
    }

    const success = await linkMetamaskToAccount(decoded.odSI, metamaskAddress);

    if (!success) {
      return json({ error: 'Failed to link wallet' }, { status: 500 });
    }

    return json({
      success: true,
      message: 'Wallet linked successfully'
    });
  } catch (error) {
    console.error('Link metamask error:', error);
    if (error instanceof Error && error.message.includes('already linked')) {
      return json({ error: 'This wallet is already linked to another account' }, { status: 400 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};
