import { apiFetch } from "@/lib/api";

export interface Agent {
  id: string;
  name: string;         // businessName from API, aliased as name for UI
  businessName: string;
}

export interface Vehicle {
  id: string;
  agentId: string;
  vehicleTypeId: string;
  name: string;
  company: string;
  seatingCapacity: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehicleDTO {
  agentId: string;
  vehicleTypeId: string;
  name: string;
  company: string;
  seatingCapacity: number;
}

export interface UpdateVehicleDTO {
  vehicleTypeId?: string;
  name?: string;
  company?: string;
  seatingCapacity?: number;
  isActive?: boolean;
}

export async function getAgents(): Promise<Agent[]> {
  const agents = await apiFetch<any[]>("/agents", { method: "GET" });
  // Map businessName → name so existing UI dropdowns work unchanged
  return agents.map((a) => ({
    ...a,
    name: a.businessName ?? a.name ?? "",
  }));
}

export async function getVehiclesByAgent(agentId: string | null): Promise<Vehicle[]> {
  if (!agentId) return [];
  return apiFetch<Vehicle[]>(`/agentVehicles/ByAgent/${agentId}`, { method: "GET" });
}

export async function addAgentVehicle(payload: CreateVehicleDTO): Promise<Vehicle> {
  return apiFetch<Vehicle>("/agentVehicles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAgentVehicle(id: string, payload: UpdateVehicleDTO): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/agentVehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAgentVehicle(id: string): Promise<void> {
  return apiFetch(`/agentVehicles/${id}`, { method: "DELETE" });
}
