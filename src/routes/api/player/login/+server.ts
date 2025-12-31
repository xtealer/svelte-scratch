import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validatePlayerLogin, generatePlayerToken } from '$lib/server/db/playerUsers';

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
    console.error('Login error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
