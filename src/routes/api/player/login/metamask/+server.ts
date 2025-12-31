import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loginWithMetamask, generatePlayerToken } from '$lib/server/db/playerUsers';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { metamaskAddress } = await request.json();

    if (!metamaskAddress) {
      return json({ error: 'Metamask address required' }, { status: 400 });
    }

    // Validate address format (basic check)
    if (!metamaskAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return json({ error: 'Invalid Metamask address format' }, { status: 400 });
    }

    const user = await loginWithMetamask(metamaskAddress);

    if (!user) {
      return json(
        { error: 'Wallet not linked to any account', code: 'WALLET_NOT_LINKED' },
        { status: 404 }
      );
    }

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
        metamaskAddress: user.metamaskAddress
      }
    });
  } catch (error) {
    console.error('Metamask login error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
