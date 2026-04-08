import { apiFetch } from "@/lib/api";

// ── Guest booking request — no login required ─────────────────────────────
export interface GuestBookingRequest {
  // Customer details
  customerName:   string;
  customerPhone:  string;
  customerEmail?: string;
  notes?:         string;
  // Trip details
  agentVehicleId: string;
  tripTypeId:     string;
  priceId:        string;
  pickupLocation: string;
  dropLocation?:  string;
  pickupDateTime: string;
  
  // ── NEW FIELDS ──
  isRoundTrip?:   boolean;
  returnDate?:    string;
  
  // Optional if logged in
  userId?:        string;
}

export interface BookingResponse {
  id:              string;
  bookingRef:      string;   // e.g. NC-A1B2C3
  customerName:    string;
  customerPhone:   string;
  customerEmail?:  string;
  status:          string;
  pickupLocation:  string;
  dropLocation?:   string;
  pickupDateTime:  string;
  agentName?:      string;
  agentPhone?:     string;
}

export interface BookingDetail extends BookingResponse {
  bookingId: string;
  bookingRef: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  agentVehicleId: string;
  tripTypeId: string;
  priceId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string; 
  
  // ── NEW FIELDS ──
  isRoundTrip?: boolean;
  returnDate?: string;
  
  status: string;
  finalPrice?: number;
  createdAt: string;
  updatedAt: string;
  
  // Agent Details
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  
  // Vehicle Details
  vehicleName: string;
  vehicleCompany: string;
  seatingCapacity: number;
  vehicleType: string;
  
  // Trip & Pricing
  tripTypeName: string;
  localPerKmPrice?: number;
  outPerKmPrice?: number;
  airportPrice?: number;
  
}

export type BookingStatus =
  | "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

// ── API calls ─────────────────────────────────────────────────────────────

// Public — no auth required
export async function createBooking(data: GuestBookingRequest): Promise<BookingResponse> {
  return apiFetch<BookingResponse>("/bookings", {
    method: "POST",
    body:   JSON.stringify(data),
  }, false); // requiresAuth = false
}

// Public — track by booking ref (no login needed)
export async function trackBooking(bookingRef: string): Promise<BookingDetail> {
  return apiFetch<BookingDetail>(`/bookings/track/${bookingRef}`, {
    method: "GET",
  }, false);
}

// Agent/admin only
export async function getBookingsByAgent(agentId: string): Promise<BookingDetail[]> {
  return apiFetch<BookingDetail[]>(`/Bookings/bookingsbyagent/${agentId}`, { method: "GET" });
}

export async function getBookingById(id: string): Promise<BookingDetail> {
  return apiFetch<BookingDetail>(`/Bookings/${id}`, { method: "GET" });
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus | "accept" | "reject"
): Promise<BookingResponse> {
  const map: Record<string, BookingStatus> = { accept: "confirmed", reject: "cancelled" };
  const final: BookingStatus = (map[status] as BookingStatus) ?? (status as BookingStatus);
  return apiFetch<BookingResponse>(`/Bookings/${id}`, {
    method: "PUT",
    body:   JSON.stringify({ status: final }),
  });
}

// Legacy alias kept for agent pages
export const myBookings = () => getBookingsByAgent(""); // not used in guest flow