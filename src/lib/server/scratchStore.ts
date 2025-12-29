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

// Sequential counter for code generation
let codeCounter = 0;

// Generate sequential code in format: GOLD-001-000000001
function generateCode(): string {
  codeCounter++;
  const sequenceNumber = codeCounter.toString().padStart(9, "0");
  return `GOLD-001-${sequenceNumber}`;
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
