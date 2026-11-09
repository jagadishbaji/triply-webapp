export async function getCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim() === "" || address === "Local Rental Package") return { lat: 0, lng: 0 };
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, { headers: { "User-Agent": "RIDEVO-App/1.0" }});
    const data = await response.json();
    
    if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}