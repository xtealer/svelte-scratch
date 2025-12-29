// In-memory store for scratch codes (simulates a database)

export interface ScratchTicket {
  code: string;
  plays: number;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
}

// In-memory database
const scratchCodes: Map<string, ScratchTicket> = new Map();

// Generate a random alphanumeric code
function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars (0, O, 1, I)
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate a unique code that doesn't exist in the store
function generateUniqueCode(): string {
  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    if (attempts > 100) {
      throw new Error("Could not generate unique code");
    }
  } while (scratchCodes.has(code));
  return code;
}

// Create a new scratch ticket
export function createTicket(plays: number): ScratchTicket {
  if (plays < 1 || plays > 100) {
    throw new Error("Plays must be between 1 and 100");
  }

  const code = generateUniqueCode();
  const ticket: ScratchTicket = {
    code,
    plays,
    used: false,
    createdAt: new Date(),
  };

  scratchCodes.set(code, ticket);
  return ticket;
}

// Get a ticket by code
export function getTicket(code: string): ScratchTicket | undefined {
  return scratchCodes.get(code.toUpperCase().trim());
}

// Mark a ticket as used
export function useTicket(code: string): ScratchTicket | undefined {
  const ticket = scratchCodes.get(code.toUpperCase().trim());
  if (ticket && !ticket.used) {
    ticket.used = true;
    ticket.usedAt = new Date();
    return ticket;
  }
  return undefined;
}

// Get all tickets (for admin/debug purposes)
export function getAllTickets(): ScratchTicket[] {
  return Array.from(scratchCodes.values());
}

// Get ticket stats
export function getStats(): {
  total: number;
  used: number;
  unused: number;
  totalPlays: number;
} {
  const tickets = getAllTickets();
  return {
    total: tickets.length,
    used: tickets.filter((t) => t.used).length,
    unused: tickets.filter((t) => !t.used).length,
    totalPlays: tickets.reduce((sum, t) => sum + t.plays, 0),
  };
}

// Clear all tickets (for testing)
export function clearAllTickets(): void {
  scratchCodes.clear();
}
