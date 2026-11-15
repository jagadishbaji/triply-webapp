import { FLEET_CONFIGS, calculateFare } from "./fareCalculator"

export interface CabRoute {
  slug: string
  destination: string
  title: string
  oneWayKm: number
  recommendedDays: number
  via: string
  driveTime: string
  bestTime: string
  intro: string
  highlights: string[]
  tip: string
}

// One-way distances and recommended days match the planner on the home page.
export const CAB_ROUTES: CabRoute[] = [
  {
    slug: "hubli-to-goa-cab",
    destination: "Goa",
    title: "Hubli to Goa Cab",
    oneWayKm: 180,
    recommendedDays: 2,
    via: "Ramnagar and Anmod Ghat to Panaji, Calangute, Baga and Margao",
    driveTime: "about 4 to 5 hours to Panaji, depending on traffic and ghat conditions",
    bestTime: "November to February is the busiest season, so book early for weekends and long weekends.",
    intro:
      "Going from Hubli to Goa for beaches, churches or a weekend break? We assign a verified driver and a clean AC car at a fixed per-km rate, so you know the cost before you leave.",
    highlights: ["Calangute and Baga beaches", "Old Goa churches", "Panaji and Fontainhas", "Margao and South Goa beaches"],
    tip: "The Anmod Ghat section has hairpin bends, so an experienced highway driver matters. Two days is the comfortable minimum for a round trip.",
  },
  {
    slug: "hubli-to-hampi-cab",
    destination: "Hampi",
    title: "Hubli to Hampi Cab",
    oneWayKm: 150,
    recommendedDays: 2,
    via: "Gadag and Hosapete to Hampi",
    driveTime: "about 3 to 4 hours one way",
    bestTime: "October to February is cooler and better for walking around the ruins.",
    intro:
      "Hampi is one of the easiest heritage trips from Hubli. Your driver picks you up at your door, stays with you through the sightseeing, and brings you back.",
    highlights: ["Virupaksha Temple", "Stone Chariot at Vittala Temple", "Hampi Bazaar and the ruins", "Tungabhadra riverside"],
    tip: "Start early so you cover the main sites before the midday heat. Two days lets you see Hampi without rushing.",
  },
  {
    slug: "hubli-to-gokarna-cab",
    destination: "Gokarna",
    title: "Hubli to Gokarna Cab",
    oneWayKm: 155,
    recommendedDays: 2,
    via: "Yellapur and the Yellapur Ghats to Gokarna and Murudeshwar",
    driveTime: "about 4 hours one way",
    bestTime: "October to March has calm seas and pleasant weather. The sea is rough in the monsoon.",
    intro:
      "A popular temple-and-beach trip from Hubli. Choose a Sedan for a couple, or an Ertiga or Innova for a family or group, all at fixed per-km rates.",
    highlights: ["Om Beach", "Kudle Beach", "Mahabaleshwar Temple, Gokarna", "Murudeshwar Temple"],
    tip: "Add Murudeshwar on the way back and you have a full two-day coastal circuit.",
  },
  {
    slug: "hubli-to-dandeli-cab",
    destination: "Dandeli",
    title: "Hubli to Dandeli Cab",
    oneWayKm: 75,
    recommendedDays: 1,
    via: "Haliyal to Dandeli",
    driveTime: "about 1.5 to 2 hours one way",
    bestTime: "October to February is popular for the forest and river activities. Check activity availability with your resort, as it depends on the season.",
    intro:
      "Dandeli is close enough for a quick weekend escape. Book a cab for the day, or keep it for two days if you are staying at a jungle lodge.",
    highlights: ["Kali River activities", "Jungle lodges and homestays", "Forest drives", "Weekend adventure trips"],
    tip: "For a one-day trip the 300 km package is usually enough. Tell us if you want to add nearby places on the way.",
  },
  {
    slug: "hubli-to-bangalore-cab",
    destination: "Bengaluru",
    title: "Hubli to Bangalore Cab",
    oneWayKm: 410,
    recommendedDays: 2,
    via: "NH48 through Haveri, Davanagere, Chitradurga and Tumakuru",
    driveTime: "about 7 to 8 hours one way",
    bestTime: "Leave early in the morning to avoid city traffic on arrival.",
    intro:
      "For business or family travel between Hubli and Bengaluru, an Innova or Crysta keeps a long highway drive comfortable. Rates are fixed per km, with driver bata included in the estimate.",
    highlights: ["Door-to-door pickup in Hubli and Dharwad", "Comfortable seating for long drives", "Driver details shared before pickup", "Pay after your trip"],
    tip: "The round trip is over 800 km, so the extra kilometres beyond the package are billed at the per-km rate shown below.",
  },
  {
    slug: "hubli-to-badami-cab",
    destination: "Badami and Aihole",
    title: "Hubli to Badami Cab",
    oneWayKm: 105,
    recommendedDays: 1,
    via: "Gadag to Badami, Pattadakal and Aihole",
    driveTime: "about 2.5 to 3 hours one way",
    bestTime: "October to February is best for walking around the cave temples.",
    intro:
      "A comfortable day trip for history lovers. See the Badami cave temples, Pattadakal and Aihole and return to Hubli the same day.",
    highlights: ["Badami cave temples", "Agastya Lake", "Pattadakal temples", "Aihole temple complex"],
    tip: "A single day works if you start early. Choose two days if you also want to continue to Hampi.",
  },
  {
    slug: "hubli-to-belgaum-cab",
    destination: "Belgaum",
    title: "Hubli to Belgaum Cab",
    oneWayKm: 105,
    recommendedDays: 1,
    via: "NH48 through Dharwad to Belagavi",
    driveTime: "about 2 hours one way",
    bestTime: "Available all year. Book early for early-morning flights and business meetings.",
    intro:
      "A reliable cab for business travel, airport or railway drops and family visits between Hubli and Belagavi, at a fixed per-km rate.",
    highlights: ["Business and meeting trips", "Airport and railway transfers", "Family visits", "Same-day return"],
    tip: "Tell us your meeting time and we will plan the pickup so you arrive with time to spare.",
  },
  {
    slug: "hubli-to-pune-cab",
    destination: "Pune",
    title: "Hubli to Pune Cab",
    oneWayKm: 430,
    recommendedDays: 2,
    via: "NH48 through Dharwad, Belagavi, Kolhapur and Satara",
    driveTime: "about 8 to 9 hours one way",
    bestTime: "Start early in the morning so most of the long drive is in daylight.",
    intro:
      "An intercity highway trip from Hubli to Pune with a verified driver and a well-maintained AC car. Fixed per-km rates and no advance payment.",
    highlights: ["Door-to-door pickup in Hubli and Dharwad", "Choice of Sedan, Ertiga, Innova or Crysta", "Driver details shared before pickup", "Pay after your trip"],
    tip: "The round trip is over 850 km, so extra kilometres beyond the package are billed at the per-km rate shown below.",
  },
]

export function getRoute(slug: string): CabRoute | undefined {
  return CAB_ROUTES.find((r) => r.slug === slug)
}

export interface RouteFareRow {
  carId: string
  name: string
  subtitle: string
  seats: number
  ratePerKm: number
  driverBataPerDay: number
  days: number
  billedKm: number
  total: number
}

export function routeFares(route: CabRoute, days = route.recommendedDays): RouteFareRow[] {
  const roundTripKm = route.oneWayKm * 2
  return FLEET_CONFIGS.map((car) => {
    const f = calculateFare(car, days, roundTripKm)
    return {
      carId: car.id,
      name: car.name,
      subtitle: car.subtitle,
      seats: car.seats,
      ratePerKm: car.ratePerKm,
      driverBataPerDay: car.driverBataPerDay,
      days,
      billedKm: f.billedKm,
      total: f.estimatedTotal,
    }
  })
}
