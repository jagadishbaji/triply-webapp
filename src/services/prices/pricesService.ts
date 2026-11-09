import { apiFetch } from "@/lib/api";

export interface PriceDetailsByTrip {
  id: string; agentVehicleId: string; agentVehicleName: string; agentName: string; agentId: string; vehicleName: string; vehicleTypeId?: string; seatingCapacity: number; tripTypeName: string; tripTypeId: string; localPerKmPrice?: number; localMinKm?: number; airportPrice?: number; outPerKmPrice?: number; outMinKm?: number; driverDayAllowance?: number; driverNightAllowance?: number; tollIncluded?: boolean;
}

export interface CreatePriceDTO {
  agentVehicleId: string; tripTypeId: string; localPerKmPrice?: number; localMinKm?: number; airportPrice?: number; outPerKmPrice?: number; outMinKm?: number; driverDayAllowance?: number; driverNightAllowance?: number; tollIncluded?: boolean;
}

export type CreatePriceDetailsByTrip = CreatePriceDTO;

export interface CabSearchResultDto {
  vehicleDetails: PriceDetailsByTrip; distanceKm: number; estimatedDurationMins: number; estimatedFare: number; extraPickupKm: number; extraPickupCharge: number;
}

export async function getAllPrices(): Promise<PriceDetailsByTrip[]> { return apiFetch<PriceDetailsByTrip[]>("/prices", { method: "GET" }); }
export async function addPrice(price: CreatePriceDTO): Promise<PriceDetailsByTrip> { return apiFetch<PriceDetailsByTrip>("/prices", { method: "POST", body: JSON.stringify(price) }); }
export async function updatePrice(id: string, price: Partial<CreatePriceDTO>): Promise<PriceDetailsByTrip> { return apiFetch<PriceDetailsByTrip>(`/prices/${id}`, { method: "PUT", body: JSON.stringify(price) }); }
export async function deletePrice(id: string): Promise<void> { return apiFetch(`/prices/${id}`, { method: "DELETE" }); }
export async function getPricesByAgent(agentId: string): Promise<PriceDetailsByTrip[]> { const all = await getAllPrices(); return all.filter((p) => p.agentId === agentId); }
export async function getPricesByTripTypeId(tripTypeId: string): Promise<PriceDetailsByTrip[]> { return apiFetch<PriceDetailsByTrip[]>(`/prices/pricebytrip/${tripTypeId}`, { method: "GET" }, false); }

export async function searchAvailableCabs(
  tripTypeId: string, pickupLat: number, pickupLng: number, dropLat: number, dropLng: number, isRoundTrip: boolean, pickupDate: string, returnDate?: string
): Promise<CabSearchResultDto[]> {
  const queryParams: Record<string, string> = {
    tripTypeId, pickupLat: pickupLat.toString(), pickupLng: pickupLng.toString(), dropLat: dropLat.toString(), dropLng: dropLng.toString(), isRoundTrip: isRoundTrip.toString()
  };

  if (pickupDate) queryParams.pickupDate = new Date(pickupDate).toISOString().split('T')[0];
  if (isRoundTrip && returnDate) queryParams.returnDate = new Date(returnDate).toISOString().split('T')[0];

  const query = new URLSearchParams(queryParams).toString();
  return apiFetch<CabSearchResultDto[]>(`/search?${query}`, { method: "GET" }, false);
}