"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Check, Shield, Star } from "lucide-react";

interface VehicleItem {
  id: string;
  title: string;
  description: string;
  image: string;
  features?: string[];
  rating?: number;
}

const AvailableVehicles = () => {
  const vehicles: VehicleItem[] = [
    {
      id: "mini",
      title: "Mini",
      description: "Affordable rides for quick city travel.",
      image: "/images/cars/mini-car.png",
      features: ["Fuel Efficient", "Easy Parking", "4 Passengers"],
      rating: 4.7,
    },
    {
      id: "sedan",
      title: "Sedan",
      description: "Comfortable rides for everyday journeys.",
      image: "/images/cars/sedan-car.jpg",
      features: ["Spacious Interior", "Luggage Space", "5 Passengers"],
      rating: 4.8,
    },
    {
      id: "suv",
      title: "SUV",
      description: "Spacious and strong rides for long trips.",
      image: "/images/cars/suv-car.png",
      features: ["All Terrain", "Extra Space", "7 Passengers"],
      rating: 4.9,
    },
    {
      id: "tempo",
      title: "Tempo Traveller",
      description: "Perfect for family and group travel.",
      image: "/images/cars/TT.jpg",
      features: ["Group Travel", "Comfortable Seating", "12+ Passengers"],
      rating: 4.6,
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Heading with animated underline */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-block"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Premium Fleet for Every Journey
            </h2>
            <div className="h-1.5 w-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mt-2"></div>
          </motion.div>
          <p className="text-xl text-gray-600 mt-6 max-w-3xl mx-auto">
            Select from our diverse range of meticulously maintained vehicles, tailored to meet your specific travel needs
          </p>
        </div>

        {/* Vehicle Cards - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full overflow-hidden border-0 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="relative">
                  <CardHeader className="p-0">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex items-center justify-center h-56">
                      <img
                        src={vehicle.image}
                        alt={vehicle.title}
                        className="h-full object-contain transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  </CardHeader>
                  {vehicle.rating && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm">{vehicle.rating}</span>
                    </div>
                  )}
                </div>
                <CardContent className="flex-grow p-6">
                  <div className="flex items-center justify-between mb-3">
                    <CardTitle className="text-2xl font-bold text-gray-900">{vehicle.title}</CardTitle>
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <CardDescription className="text-gray-600 text-base mb-4">
                    {vehicle.description}
                  </CardDescription>
                  {vehicle.features && (
                    <ul className="mt-4 space-y-2">
                      {vehicle.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-700">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button variant="outline" className="w-full group border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-all duration-300">
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { AvailableVehicles };
