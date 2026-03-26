import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

export interface AgentWallet {
  id: string;
  agentId: string;
  currentBalance: number;
  lifetimeSavings: number;
  creditLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerTransaction {
  id: string;
  walletId: string;
  bookingId?: string | null;
  amount: number;
  type: "ShadowCommission" | "PromoWaiver" | "WalletTopup" | "RidePayment";
  description?: string;
  createdAt: string;
}

// ── API calls ─────────────────────────────────────────────────────────────

/**
 * Fetches the wallet details for a specific agent.
 * The backend is designed to auto-provision a wallet if one doesn't exist.
 * Requires Authentication.
 */
export async function getWalletByAgentId(agentId: string): Promise<AgentWallet> {
  if (!agentId) {
    throw new Error("Agent ID is required to fetch wallet.");
  }
  
  return apiFetch<AgentWallet>(`/AgentWallets/${agentId}`, {
    method: "GET",
  }, true); // requiresAuth = true
}

/**
 * Optional Future Proofing: If you decide to expose the ledger history directly 
 * to the agent dashboard, you can build the backend endpoint for this later 
 * and uncomment this function.
 */
/*
export async function getWalletTransactions(walletId: string): Promise<LedgerTransaction[]> {
  if (!walletId) {
    throw new Error("Wallet ID is required to fetch transactions.");
  }
  
  return apiFetch<LedgerTransaction[]>(`/AgentWallets/${walletId}/transactions`, {
    method: "GET",
  }, true);
}
*/