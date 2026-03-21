import { apiFetch } from "@/lib/api";

// ── Types matching new backend schema ─────────────────────────────────────

export interface Agent {
  id: string;
  userId: string;
  businessName: string;
  name: string;           // alias for businessName — keeps existing UI working
  ownerName: string;
  email: string;
  phoneNumber: string;
  whatsAppNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  licenseNumber?: string;
  gstNumber?: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  approvalStatus: "pending" | "approved" | "rejected" | "suspended";
  approvalNote?: string;
  approvedAt?: string;
  subscriptionPlan: "free" | "pro" | "business";
  totalBookings: number;
  totalRevenue: number;
  averageRating?: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentPayload {
  email: string;
  password: string;
  agentData: {
    businessName: string;
    ownerName: string;
    phoneNumber: string;
    address: string;
    city?: string;
    licenseNumber?: string;
    whatsAppNumber?: string;
    gstNumber?: string;
  };
}

export interface UpdateAgentPayload {
  businessName?: string;
  ownerName?: string;
  phoneNumber?: string;
  whatsAppNumber?: string;
  address?: string;
  city?: string;
  pincode?: string;
  licenseNumber?: string;
  gstNumber?: string;
}

// ── Queries ───────────────────────────────────────────────────────────────

export async function getAgents(): Promise<Agent[]> {
  return apiFetch<Agent[]>("/agents", { method: "GET" });
}

export async function getAgent(id: string): Promise<Agent> {
  return apiFetch<Agent>(`/agents/${id}`, { method: "GET" });
}

export async function getInActiveAgents(): Promise<Agent[]> {
  return apiFetch<Agent[]>("/agents/pending", { method: "GET" });
}

// ── Commands ──────────────────────────────────────────────────────────────

export async function createAgent(payload: CreateAgentPayload): Promise<Agent> {
  return apiFetch<Agent>("/Auth/agentSignup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAgent(id: string, payload: UpdateAgentPayload): Promise<Agent> {
  return apiFetch<Agent>(`/agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAgent(id: string): Promise<void> {
  return apiFetch(`/agents/${id}`, { method: "DELETE" });
}

// ── Approval workflow ─────────────────────────────────────────────────────

export async function approveAgent(id: string): Promise<Agent> {
  return apiFetch<Agent>(`/agents/${id}/approve`, { method: "POST" });
}

export async function rejectAgent(id: string, note: string): Promise<Agent> {
  return apiFetch<Agent>(`/agents/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function suspendAgent(id: string, note: string): Promise<Agent> {
  return apiFetch<Agent>(`/agents/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

// Kept for backward compat with existing pages
export async function updateAgentStatus(id: string, status: boolean): Promise<void> {
  return apiFetch(`/agents/status/${id}`, {
    method: "POST",
    body: JSON.stringify(status),
  });
}
