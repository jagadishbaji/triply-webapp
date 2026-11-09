import { apiFetch } from "@/lib/api";

export interface tripType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Public endpoint — no auth required
export async function gettripTypes(): Promise<tripType[]> {
  return apiFetch<tripType[]>("/TripTypes", { method: "GET" }, false);
}

export async function addtripType(payload: Partial<tripType> & { name: string }): Promise<tripType> {
  return apiFetch<tripType>("/TripTypes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatetripType(id: string, payload: Partial<tripType>): Promise<tripType> {
  return apiFetch<tripType>(`/TripTypes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletetripType(id: string): Promise<void> {
  return apiFetch(`/TripTypes/${id}`, { method: "DELETE" });
}
