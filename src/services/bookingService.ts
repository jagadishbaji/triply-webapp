import { getCookie } from "cookies-next";

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
