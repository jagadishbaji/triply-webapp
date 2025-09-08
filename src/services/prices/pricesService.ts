// ==================== services/pricesService.ts ====================
import { apiFetch } from "@/lib/api"
import { getCookie } from "cookies-next"

export interface PriceDTO {
  id: string
  agentVehicleId: string
  tripTypeId: string
  localPerKmPrice?: number
  localMinKm?: number
  airportPrice?: number
  outPerKmPrice?: number
  outMinKm?: number
}

export interface CreatePriceDTO {
  agentVehicleId: string
  tripTypeId: string
  localPerKmPrice?: number
  localMinKm?: number
  airportPrice?: number
  outPerKmPrice?: number
  outMinKm?: number
}

export interface PriceDetailsByTrip {
  id: string
  agentVehicleId: string
  agentVehicleName: string
  agentName: string
  agentId: string
  vehicleName: string
  seatingCapacity: number
  tripTypeName: string
  localPerKmPrice?: number
  localMinKm?: number
  airportPrice?: number
  outPerKmPrice?: number
  outMinKm?: number
  tripTypeId: string
}

export async function getAllPrices(): Promise<PriceDetailsByTrip[]> {
  return apiFetch<PriceDetailsByTrip[]>("/api/prices", {
    method: "GET",
    headers: { Authorization: `Bearer ${getCookie("accessToken")}` },
  })
}

export async function addPrice(price: CreatePriceDTO) {
  return apiFetch<PriceDTO>("/api/prices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
    body: JSON.stringify(price),
  })
}

export async function updatePrice(id: string, price: Partial<CreatePriceDTO>) {
  return apiFetch<PriceDTO>(`/api/prices/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
    body: JSON.stringify(price),
  })
}

export async function deletePrice(id: string) {
  return apiFetch(`/api/prices/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getCookie("accessToken")}` },
  })
}

export async function getPricesByAgent(agentId: string): Promise<PriceDetailsByTrip[]> {
  const allPrices = await getAllPrices()
  return allPrices.filter((price) => price.agentId === agentId)
}
