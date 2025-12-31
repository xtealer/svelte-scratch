import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loginWithMetamask, createMetamaskUser, generatePlayerToken } from '$lib/server/db/playerUsers';

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

    // Try to find existing user with this wallet
    let user = await loginWithMetamask(metamaskAddress);

    // If no user found, auto-create a new MetaMask-only account
    if (!user) {
      user = await createMetamaskUser(metamaskAddress);
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
