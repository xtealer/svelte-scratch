import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getRechargeCard, useRechargeCard } from "$lib/server/db/rechargeCards";
import { getOrCreateSession, getSessionStatus } from "$lib/server/db/gameSessions";

// POST - Validate and use a scratch code
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, gameId = 'scratch' } = await request.json();

    if (!code || typeof code !== "string") {
      return json({ error: "Invalid code format" }, { status: 400 });
    }

    if (!['slots', 'scratch'].includes(gameId)) {
      return json({ error: "Invalid game" }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();
    const ticket = await getRechargeCard(upperCode);

    if (!ticket) {
      return json({ error: "Code not found" }, { status: 404 });
    }

    if (ticket.used) {
      // Check if there's an existing session with plays left or winnings
      const status = await getSessionStatus(upperCode, gameId);

      if (status && (status.playsLeft > 0 || status.totalWinnings > 0)) {
        // Return existing session data
        return json({
          success: true,
          code: upperCode,
          plays: status.playsLeft,
          totalWinnings: status.totalWinnings,
          message: `Session restored with ${status.playsLeft} play${status.playsLeft !== 1 ? "s" : ""} remaining`,
        });
      }

      return json({ error: "Code already used" }, { status: 400 });
    }

    // Mark code as used
    const usedTicket = await useRechargeCard(upperCode);
    if (!usedTicket) {
      return json({ error: "Failed to use code" }, { status: 500 });
    }

    // Create game session
    const session = await getOrCreateSession(upperCode, gameId, usedTicket.plays);

    return json({
      success: true,
      code: upperCode,
      plays: usedTicket.plays,
      totalWinnings: session.totalWinnings,
      message: `Loaded ${usedTicket.plays} play${usedTicket.plays > 1 ? "s" : ""}!`,
    });
  } catch (error) {
    console.error('Scratch code error:', error);
    return json({ error: "Server error" }, { status: 500 });
  }
};

// GET - Check code status
export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get("code");

  if (!code) {
    return json({ error: "Code parameter required" }, { status: 400 });
  }

  try {
    const upperCode = code.toUpperCase().trim();
    const ticket = await getRechargeCard(upperCode);

    if (!ticket) {
      return json({ exists: false });
    }

    return json({
      exists: true,
      used: ticket.used,
      plays: ticket.used ? 0 : ticket.plays,
      createdAt: ticket.createdAt,
    });
  } catch {
    return json({ error: "Server error" }, { status: 500 });
  }
};
