export interface PhotonFeature {
  name: string;
  sub?: string;
}

export async function searchPlacesAutocomplete(query: string, signal?: AbortSignal): Promise<PhotonFeature[]> {
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=15.3647&lon=75.1240`, { signal });
    const data = await res.json();
    return (data.features || []).map((f: any) => {
      const p = f.properties;
      const subArr = [p.city, p.state].filter(Boolean);
      const sub = subArr.join(", ");
      return { name: p.name, sub: sub !== p.name ? sub : undefined };
    });
  } catch (e: any) {
    if (e.name === 'AbortError') return [];
    console.error("Photon API error:", e);
    return [];
  }
}