"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface VehicleItem {
  id: string;
  title: string;
  description: string;
  image: string;
}

const AvailableVehicles = () => {
  const vehicles: VehicleItem[] = [
    {
      id: "mini",
      title: "Mini",
      description: "Affordable rides for quick city travel.",
      image: "/images/cars/mini-car.png",
    },
    {
      id: "sedan",
      title: "Sedan",
      description: "Comfortable rides for everyday journeys.",
      image: "/images/cars/sedan-car.jpg",
    },
    {
      id: "suv",
      title: "SUV",
      description: "Spacious and strong rides for long trips.",
      image: "/images/cars/suv-car.png",
    },
    {
      id: "tempo",
      title: "Tempo Traveller",
      description: "Perfect for family and group travel.",
      image: "/images/cars/TT.jpg",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container text-center">
        {/* Heading */}
        <h2 className="mb-8 text-4xl font-bold">Available Vehicles</h2>
        <p className="text-muted-foreground mb-12">
          Choose from our wide range of vehicles to fit your journey
        </p>

        {/* Vehicle Cards */}
        <div className="flex justify-center gap-8 flex-wrap">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className="w-80 hover:shadow-2xl transition-shadow duration-300"
            >
              <CardHeader className="p-0">
                <img
                  src={vehicle.image}
                  alt={vehicle.title}
                  className="h-56 w-full object-contain rounded-t-2xl"
                />
              </CardHeader>
              <CardContent className="text-center">
                <CardTitle className="text-2xl">{vehicle.title}</CardTitle>
                <CardDescription className="mt-2 text-gray-600">
                  {vehicle.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export { AvailableVehicles };
