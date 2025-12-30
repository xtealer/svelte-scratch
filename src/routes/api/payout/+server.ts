import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  createPayoutRequest,
  getPayoutRequestByCode,
  getSessionStatus
} from '$lib/server/db/gameSessions';

// POST - Create a payout request
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, gameId, amount, playerName, playerPhone, playerCountry } = await request.json();

    // Validate inputs
    if (!code || typeof code !== 'string') {
      return json({ error: 'Invalid code' }, { status: 400 });
    }

    if (!gameId || !['slots', 'scratch'].includes(gameId)) {
      return json({ error: 'Invalid game' }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length < 2) {
      return json({ error: 'Full name is required (min 2 characters)' }, { status: 400 });
    }

    if (!playerPhone || typeof playerPhone !== 'string' || playerPhone.trim().length < 6) {
      return json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    if (!playerCountry || typeof playerCountry !== 'string') {
      return json({ error: 'Country is required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();

    // Check if request already exists
    const existingRequest = await getPayoutRequestByCode(upperCode);
    if (existingRequest) {
      return json({
        error: 'A payout request already exists for this code',
        existingRequest: {
          status: existingRequest.status,
          amount: existingRequest.amount,
          createdAt: existingRequest.createdAt
        }
      }, { status: 400 });
    }

    // Verify session exists and has winnings
    const session = await getSessionStatus(upperCode, gameId);
    if (!session) {
      return json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.totalWinnings !== amount) {
      return json({ error: 'Amount does not match session winnings' }, { status: 400 });
    }

    // Create the payout request
    const payoutRequest = await createPayoutRequest(
      upperCode,
      gameId,
      amount,
      playerName.trim(),
      playerPhone.trim(),
      playerCountry
    );

    return json({
      success: true,
      request: {
        id: payoutRequest._id?.toString(),
        code: payoutRequest.code,
        amount: payoutRequest.amount,
        status: payoutRequest.status,
        createdAt: payoutRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Payout request error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};

// GET - Check payout request status
export const GET: RequestHandler = async ({ url }) => {
  try {
    const code = url.searchParams.get('code');

    if (!code) {
      return json({ error: 'Code required' }, { status: 400 });
    }

    const request = await getPayoutRequestByCode(code);

    if (!request) {
      return json({ exists: false });
    }

    return json({
      exists: true,
      request: {
        code: request.code,
        amount: request.amount,
        status: request.status,
        createdAt: request.createdAt,
        processedAt: request.processedAt
      }
    });
  } catch (error) {
    console.error('Payout status error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
