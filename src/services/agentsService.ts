// services/agentService.ts
import { apiFetch } from "@/lib/api"
import { getCookie } from "cookies-next";
import { email } from "zod";

export interface Agent {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  licenseNumber: string;
  createdAt: string;
  isActive:boolean; 
  password:string;
  
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
  return apiFetch<Agent>("/api/auth/agentSignup", {
    method: "POST",
    body: JSON.stringify({
       email: agent.email,
          password: agent.password,
          role: "agent",
          agents: {
            name: agent.name,
            email: agent.email, // duplicate to match DTO
            phoneNumber: agent.phoneNumber,
            address: agent.address,
            licenseNumber: agent.licenseNumber,
            isActive: agent.isActive,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
    })
    // headers: {
    //   Authorization: `Bearer ${getCookie("accessToken")}`, // <- is token passed here?
    // }
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
