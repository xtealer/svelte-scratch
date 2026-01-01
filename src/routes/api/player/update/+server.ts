import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPlayerToken, updatePlayerUser, getPlayerUserById, generatePlayerToken } from '$lib/server/db/playerUsers';
import type { SupportedLanguage } from '$lib/server/db/types';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'es', 'ar'];

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Verify token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyPlayerToken(token);
    if (!payload) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { preferredLanguage } = body;

    // Validate language if provided
    if (preferredLanguage !== undefined) {
      if (!SUPPORTED_LANGUAGES.includes(preferredLanguage)) {
        return json({ error: 'Invalid language' }, { status: 400 });
      }
    }

    // Build updates object
    const updates: { preferredLanguage?: SupportedLanguage } = {};
    if (preferredLanguage !== undefined) {
      updates.preferredLanguage = preferredLanguage;
    }

    // Update user
    const updated = await updatePlayerUser(payload.odSI, updates);
    if (!updated) {
      return json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Get updated user to generate new token
    const user = await getPlayerUserById(payload.odSI);
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Generate new token with updated data
    const newToken = generatePlayerToken(user);

    return json({
      success: true,
      token: newToken,
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
    console.error('Update profile error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
