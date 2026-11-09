import { apiFetch } from "@/lib/api";

export interface vehicleType {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  description?: string;
  exampleVehicles?: string;
  iconEmoji: string;
  minSeats: number;
  maxSeats: number;
  typicalPriceMin?: number;
  typicalPriceMax?: number;
  sortOrder: number;
  isActive: boolean;
  isPopular: boolean;
  badgeLabel?: string;
  badgeColor?: string;
  createdAt?: string;
}

// Public endpoint — no auth required (homepage search needs this)
export async function getVehicleTypes(): Promise<vehicleType[]> {
  return apiFetch<vehicleType[]>("/VehicleTypes", { method: "GET" }, false);
}

export async function addVehicleType(payload: Partial<vehicleType> & { name: string }): Promise<vehicleType> {
  return apiFetch<vehicleType>("/VehicleTypes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVehicleType(id: string, payload: Partial<vehicleType>): Promise<vehicleType> {
  return apiFetch<vehicleType>(`/VehicleTypes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteVehicleType(id: string): Promise<void> {
  return apiFetch(`/VehicleTypes/${id}`, { method: "DELETE" });
}
