import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPlayerUser, generatePlayerToken } from '$lib/server/db/playerUsers';
import type { SupportedLanguage } from '$lib/server/db/types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password, fullName, country, preferredLanguage } = await request.json();

    // Validate required fields
    if (!email || !password || !fullName || !country || !preferredLanguage) {
      return json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Validate language
    const validLanguages: SupportedLanguage[] = ['en', 'es', 'ar'];
    if (!validLanguages.includes(preferredLanguage)) {
      return json({ error: 'Invalid language' }, { status: 400 });
    }

    // Create the user
    const user = await createPlayerUser({
      email,
      password,
      fullName,
      country,
      preferredLanguage
    });

    // Generate token
    const token = generatePlayerToken(user);

    return json({
      success: true,
      token,
      user: {
        odSI: user._id?.toString(),
        email: user.email,
        fullName: user.fullName,
        country: user.country,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error && error.message === 'Email already exists') {
      return json({ error: 'Email already exists' }, { status: 400 });
    }
    return json({ error: 'Server error' }, { status: 500 });
  }
};
