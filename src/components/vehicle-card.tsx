import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceDetailsByTrip } from "@/services/prices/pricesService"

interface VehicleCardProps {
  vehicle: PriceDetailsByTrip
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition rounded-2xl">
      <CardHeader>
        <CardTitle>{vehicle.vehicleName} ({vehicle.agentVehicleName})</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Agency:</strong> {vehicle.agentName}</p>
        <p><strong>Seats:</strong> {vehicle.seatingCapacity}</p>
        <p><strong>Trip Type:</strong> {vehicle.tripTypeName}</p>
        {vehicle.airportPrice ? (
          <p><strong>Airport Price:</strong> ₹{vehicle.airportPrice}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
