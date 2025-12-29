import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createTicket, getStats, getAllTickets } from "$lib/server/scratchStore";

// POST - Generate a new scratch ticket
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const plays = typeof body.plays === "number" ? body.plays : 1;

    if (plays < 1 || plays > 100) {
      return json(
        { error: "Plays must be between 1 and 100" },
        { status: 400 }
      );
    }

    const ticket = createTicket(plays);

    return json({
      success: true,
      ticket: {
        code: ticket.code,
        plays: ticket.plays,
        createdAt: ticket.createdAt,
      },
      message: `Generated ticket with ${plays} play${plays > 1 ? "s" : ""}`,
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
};

// GET - Get stats and list of tickets (for admin/debug)
export const GET: RequestHandler = async ({ url }) => {
  const showAll = url.searchParams.get("all") === "true";

  const stats = getStats();

  if (showAll) {
    const tickets = getAllTickets().map((t) => ({
      code: t.code,
      plays: t.plays,
      used: t.used,
      createdAt: t.createdAt,
      usedAt: t.usedAt,
    }));

    return json({
      stats,
      tickets,
    });
  }

  return json({ stats });
};
