import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loginWithMetamask, createMetamaskUser, generatePlayerToken } from '$lib/server/db/playerUsers';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { metamaskAddress, createIfNotExists } = await request.json();

    if (!metamaskAddress) {
      return json({ error: 'Metamask address required' }, { status: 400 });
    }

    // Validate address format (basic check)
    if (!metamaskAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return json({ error: 'Invalid Metamask address format' }, { status: 400 });
    }

    // Try to find existing user with this wallet
    let user = await loginWithMetamask(metamaskAddress);

    // If no user found, either create new account or return WALLET_NOT_LINKED
    if (!user) {
      if (createIfNotExists) {
        user = await createMetamaskUser(metamaskAddress);
      } else {
        return json({
          error: 'Wallet not linked to any account',
          code: 'WALLET_NOT_LINKED'
        }, { status: 404 });
      }
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
        metamaskAddress: user.metamaskAddress,
        usdtBalance: user.usdtBalance ?? 0
      }
    });
  } catch (error) {
    console.error('Metamask login error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
