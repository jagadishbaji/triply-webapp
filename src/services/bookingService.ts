import { getCookie } from "cookies-next";
import { apiFetch } from "@/lib/api";

export interface BookingRequest {
  userId: string;
  agentVehicleId: string;
  tripTypeId: string;
  priceId: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDateTime: string;
}

export interface BookingResponse {
  bookingId?: string;
  status?: string;
  message: string;
}

/**
 * Creates a new booking
 */
export const createBooking = async (
  bookingData: BookingRequest,
  token?: string
): Promise<BookingResponse> => {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // ✅ Prefer passed token, else read from cookies
  const authToken = token || (getCookie("accessToken") as string);

  if (!authToken) {
    throw new Error("Authentication token missing. Please login again.");
  }

  try {
    const response = await fetch(`${apiBase}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(bookingData),
    });

    const responseText = await response.text();

    if (!response.ok) {
      // Try to parse error JSON
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || "Failed to create booking");
      } catch {
        // If backend returned non-JSON (HTML, etc.)
        console.error("Non-JSON error response:", responseText.substring(0, 200));
        throw new Error(
          `Server error (${response.status}): Please try again later.`
        );
      }
    }

    // ✅ Parse success JSON safely
    try {
      const result = JSON.parse(responseText);
      return result;
    } catch (parseError) {
      console.error("Error parsing booking response:", parseError);
      throw new Error("Invalid response format from server.");
    }
  } catch (error: any) {
    console.error("Error creating booking:", error);
    throw new Error(error.message || "Failed to create booking.");
  }
};

// ==================== List current user's bookings ====================
export interface MyBooking {
  id?: string;
  bookingId?: string;
  status?: string;
  pickupLocation?: string;
  dropLocation?: string;
  pickupDateTime?: string;
  tripTypeName?: string;
  agentVehicleName?: string;
  vehicleName?: string;
  createdAt?: string;
  [key: string]: any;
}

export async function myBookings(): Promise<MyBooking[]> {
  return apiFetch<MyBooking[]>("/api/bookings/my", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
  });
}

// ==================== Agent bookings and updates ====================
export interface AgentBooking extends MyBooking {
  userName?: string;
  phone?: string;
}

export async function getBookingsByAgent(agentId: string): Promise<AgentBooking[]> {
  return apiFetch<AgentBooking[]>(`/api/Bookings/bookingsbyagent/${agentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
  });
}

export type BookingStatus = "pending" | "confirmed" | "ongoing" | "completed" | "cancelled" | "accept" | "reject";

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<any> {
  // Map legacy actions to accepted statuses
  const map: Record<string, BookingStatus> = {
    accept: "confirmed",
    reject: "cancelled",
  } as const;

  const finalStatus = (map[status] as BookingStatus) || status;
  const allowed: BookingStatus[] = ["pending", "confirmed", "ongoing", "completed", "cancelled"];
  if (!allowed.includes(finalStatus)) {
    throw new Error(`Invalid status '${status}'. Allowed: ${allowed.join(", ")}`);
  }

  return apiFetch(`/api/Bookings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
    body: JSON.stringify({ status: finalStatus }),
  });
}

// Get a single booking by ID (for details modal)
export async function getBookingById(id: string): Promise<AgentBooking> {
  return apiFetch<AgentBooking>(`/api/Bookings/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getCookie("accessToken")}`,
    },
  });
}
