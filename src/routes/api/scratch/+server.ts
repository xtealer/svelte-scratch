import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Mock database of scratch codes
// In production, this would be a real database
const scratchCodes: Record<
  string,
  { plays: number; used: boolean; createdAt: Date }
> = {
  GOLD123: { plays: 3, used: false, createdAt: new Date() },
  LUCKY456: { plays: 5, used: false, createdAt: new Date() },
  WIN789: { plays: 1, used: false, createdAt: new Date() },
  MEGA000: { plays: 10, used: false, createdAt: new Date() },
  TEST001: { plays: 2, used: false, createdAt: new Date() },
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return json({ error: "Invalid code format" }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();
    const scratchData = scratchCodes[upperCode];

    if (!scratchData) {
      return json({ error: "Code not found" }, { status: 404 });
    }

    if (scratchData.used) {
      return json({ error: "Code already used" }, { status: 400 });
    }

    // Mark code as used
    scratchData.used = true;

    return json({
      success: true,
      code: upperCode,
      plays: scratchData.plays,
      message: `Loaded ${scratchData.plays} play${scratchData.plays > 1 ? "s" : ""}!`,
    });
  } catch {
    return json({ error: "Server error" }, { status: 500 });
  }
};

// GET endpoint to check code status (optional)
export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get("code");

  if (!code) {
    return json({ error: "Code parameter required" }, { status: 400 });
  }

  const upperCode = code.toUpperCase().trim();
  const scratchData = scratchCodes[upperCode];

  if (!scratchData) {
    return json({ exists: false });
  }

  return json({
    exists: true,
    used: scratchData.used,
    plays: scratchData.used ? 0 : scratchData.plays,
  });
};
