// services/tripTypesService.ts
import { apiFetch } from "@/lib/api"
import { getCookie } from "cookies-next";

export interface tripType {
  id: string;
  name: string;  

}


// ✅ Get all vehicle types
export async function gettripTypes(): Promise<tripType[]> {
  return apiFetch<tripType[]>("/api/tripTypes", { method: "GET", headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`, // <- is token passed here?
    },})
  
}

// ✅ Add new vehicle type
export async function addtripType(tripType: Omit<tripType, "id">) {
  return apiFetch("/api/tripTypes", {
    method: "POST",
    headers: {      
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
    body: JSON.stringify(tripType),
  })
}

// ✅ Update vehicle type
export async function updatetripType(id: string, tripType: Partial<tripType>) {
  return apiFetch(`/api/tripTypes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
    body: JSON.stringify(tripType),
  })
}

// ✅ Delete vehicle type
export async function deletetripType(id: string) {
  return apiFetch(`/api/tripTypes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
  })
}
