import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recordCreditConversion, getSessionStatus } from '$lib/server/db/gameSessions';

// POST - Record a credit conversion (winnings to credits)
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

    // Verify session exists and has winnings
    const session = await getSessionStatus(upperCode, gameId);
    if (!session) {
      return json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.totalWinnings !== amount) {
      return json({ error: 'Amount does not match session winnings' }, { status: 400 });
    }

    // Record the credit conversion
    const conversion = await recordCreditConversion(
      upperCode,
      gameId,
      amount,
      playerName.trim(),
      playerPhone.trim(),
      playerCountry
    );

    return json({
      success: true,
      conversion: {
        id: conversion._id?.toString(),
        code: conversion.code,
        amount: conversion.amount,
        convertedAt: conversion.convertedAt
      }
    });
  } catch (error) {
    console.error('Credit conversion error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
