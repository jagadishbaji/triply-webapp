// Define the exact shape of your C# BookingDetailsResponseDto
export interface BookingDetailsDto {
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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5001/api";

export async function getAgentBookings(agentId: string): Promise<BookingDetailsDto[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/agent/${agentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${token}` // Uncomment if using auth tokens
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("BookingService Error:", error);
    throw error;
  }
}