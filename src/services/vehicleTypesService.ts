// services/vehicleTypesService.ts
import { apiFetch } from "@/lib/api"
import { getCookie } from "cookies-next";

export interface vehicleType {
  id: string;
  name: string;  

}


// ✅ Get all vehicle types
export async function getVehicleTypes(): Promise<vehicleType[]> {
  return apiFetch<vehicleType[]>("/api/VehicleTypes", { method: "GET", headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`, // <- is token passed here?
    },})
  
}

// ✅ Add new vehicle type
export async function addVehicleType(vehicleType: Omit<vehicleType, "id">) {
  return apiFetch("/api/vehicleTypes", {
    method: "POST",
    headers: {      
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
    body: JSON.stringify(vehicleType),
  })
}

// ✅ Update vehicle type
export async function updateVehicleType(id: string, vehicleType: Partial<vehicleType>) {
  return apiFetch(`/api/vehicleTypes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
    body: JSON.stringify(vehicleType),
  })
}

// ✅ Delete vehicle type
export async function deleteVehicleType(id: string) {
  return apiFetch(`/api/vehicleTypes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
  })
}
