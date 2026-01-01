import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getRechargeCard, useRechargeCard } from "$lib/server/db/rechargeCards";
import { getOrCreatePlayerSession, getPlayerSessionStatus } from "$lib/server/db/gameSessions";

// POST - Validate and use a scratch code (unified player session)
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
      // Check if there's an existing unified player session with credits or winnings
      const status = await getPlayerSessionStatus(upperCode);

      if (status && (status.creditsLeft > 0 || status.totalWinnings > 0)) {
        // Return existing session data (works across all games)
        return json({
          success: true,
          code: upperCode,
          plays: status.creditsLeft,
          totalWinnings: status.totalWinnings,
          wagerRequired: status.wagerRequired,
          wagerCompleted: status.wagerCompleted,
          wagerMet: status.wagerMet,
          message: `Session restored with ${status.creditsLeft} credit${status.creditsLeft !== 1 ? "s" : ""} remaining`,
        });
      }

      return json({ error: "Code already used" }, { status: 400 });
    }

    // Mark code as used
    const usedTicket = await useRechargeCard(upperCode);
    if (!usedTicket) {
      return json({ error: "Failed to use code" }, { status: 500 });
    }

    // Create unified player session (works across all games)
    const session = await getOrCreatePlayerSession(upperCode, usedTicket.plays);

    return json({
      success: true,
      code: upperCode,
      plays: usedTicket.plays,
      totalWinnings: session.totalWinnings,
      wagerRequired: session.wagerRequired || 0,
      wagerCompleted: session.wagerCompleted || 0,
      wagerMet: (session.wagerCompleted || 0) >= (session.wagerRequired || 0),
      message: `Loaded ${usedTicket.plays} credit${usedTicket.plays > 1 ? "s" : ""}!`,
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
