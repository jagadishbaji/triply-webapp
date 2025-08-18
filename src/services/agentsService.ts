// services/agentService.ts
import { apiFetch } from "@/lib/api"
import { getCookie } from "cookies-next";

export interface Agent {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  licenseNumber: string;
  createdAt: string;
}

// ✅ Get all agents
export async function getAgents(): Promise<Agent[]> {
  return apiFetch<Agent[]>("/api/agents", { method: "GET", headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`, // <- is token passed here?
    },})
}

// ✅ Get single agent
export async function getAgent(id: string): Promise<Agent> {
  return apiFetch<Agent>(`/api/agents/${id}`, { method: "GET" ,headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`, // <- is token passed here?
    }})
}

// ✅ Create agent
export async function createAgent(agent: Omit<Agent, "id" | "createdAt">) {
  return apiFetch<Agent>("/api/agents", {
    method: "POST",
    body: JSON.stringify(agent),
    headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`, // <- is token passed here?
    }
  })
}

// ✅ Update agent
export async function updateAgent(id: string, agent: Partial<Agent>) {
  return apiFetch<Agent>(`/api/agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(agent),
    headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`, // <- is token passed here?
    }
  })
}

// ✅ Delete agent
export async function deleteAgent(id: string) {
  return apiFetch(`/api/agents/${id}`, { method: "DELETE" ,headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`, // <- is token passed here?
    }})
}
