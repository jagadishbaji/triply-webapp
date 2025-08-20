import { apiFetch } from "@/lib/api"
import { getCookie } from "cookies-next"

export type Agent = {
  id: string
  name: string
}

export type Vehicle = {
  agentId: string
  vehicleTypeId: string
  name: string
  company: string
  seatingCapacity: number   
  id:string
}
export type CreateVehicleDTO = {
  agentId: string
  vehicleTypeId: string
  name: string
  company: string
  seatingCapacity: number
}

// ✅ Get all agents
export async function getAgents(): Promise<Agent[]> {
  return apiFetch<Agent[]>("/api/agents", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`, // token is passed here
    },
  })
}

// ✅ Get vehicles for agent
export async function getVehiclesByAgent(agentId: string | null): Promise<Vehicle[]> {
  return apiFetch<Vehicle[]>(`/api/agentVehicles/ByAgent/${agentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
  })
}
  // ✅ Add new agent vehicle
  export async function addAgentVehicle(payload: CreateVehicleDTO):Promise<Vehicle> {
    return apiFetch("/api/agentVehicles", {
      method: "POST",
      headers: {      
        Authorization: `Bearer ${getCookie("accessToken")}`,
      },
      body: JSON.stringify(payload),
    })
  }
  
  // ✅ Update agent vehicle
  export async function updateAgentVehicle(id: string, agentVehicle: Partial<Vehicle>) {
    return apiFetch(`/api/agentVehicles/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("accessToken")}`,
      },
      body: JSON.stringify(agentVehicle),
    })
  }
  
  // ✅ Delete agent vehicle
  export async function deleteAgentVehicle(id: string) {
    return apiFetch(`/api/agentVehicles/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getCookie("accessToken")}`,
      },
    })}
