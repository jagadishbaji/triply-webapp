"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCookie } from "cookies-next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

import { Car, MapPin, Repeat, Calendar, LogOut, User, ClipboardList } from "lucide-react";

import { gettripTypes } from "@/services/admin/tripTypesService";
import { getVehicleTypes } from "@/services/admin/vehicleTypesService";
import { logout } from "@/services/authService";

export default function UserDashboardPage() {
  const router = useRouter();

  const [tripTypes, setTripTypes] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

  const [tripTypeId, setTripTypeId] = useState("");
  const [tripTypeName, setTripTypeName] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [vehicleTypeName, setVehicleTypeName] = useState("");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trips = await gettripTypes();
        setTripTypes(trips || []);
        const vehicles = await getVehicleTypes();
        setVehicleTypes(vehicles || []);
      } catch (err) {
        // Handle errors silently for UX
      }
    };
    fetchData();

    const name = getCookie("loggedName");
    if (name) setUserName(name as string);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripTypeId || !pickup || !date || !vehicleTypeId || (tripTypeName !== "Airport" && !destination)) {
      alert("Please fill in all required fields before searching.");
      return;
    }

    router.push(
      `/user/vehicles?tripTypeId=${tripTypeId}&tripTypeName=${encodeURIComponent(tripTypeName)}&vehicleTypeId=${vehicleTypeId}&vehicleTypeName=${encodeURIComponent(vehicleTypeName)}&pickup=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`
    );
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-100 via-white to-green-200">
      {/* Header - rounded and consistent with site theme */}
      <header className="flex items-center justify-between px-6 md:px-10 py-4 bg-white/90 backdrop-blur-md shadow-xl rounded-3xl border border-green-100 mx-4 mt-4 sticky top-0 z-30">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Triply Cars</span>
        </h1>
        <nav className="flex items-center gap-3 md:gap-4">
          <Link href="/">
            <Button variant="ghost" className="rounded-xl text-green-700 hover:bg-green-50 font-semibold">Home</Button>
          </Link>
          <Link href="/user/mybookings">
            <Button variant="ghost" className="gap-2 text-green-700 hover:bg-green-50 rounded-xl font-semibold">
              <ClipboardList className="w-5 h-5" />
              My Bookings
            </Button>
          </Link>
          <Link href="/user/profile">
            <Button variant="ghost" className="gap-2 text-green-700 hover:bg-green-50 rounded-xl font-semibold">
              <User className="w-5 h-5" />
              Profile
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="gap-2 text-green-700 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-green-700 font-semibold rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </nav>
      </header>

      {/* Welcome Section */}
      <section className="w-full text-center py-12 px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Welcome, <span className="bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">{userName}</span>!
        </h2>
        <p className="text-lg text-gray-700">Ready to book your next ride? Use the search below to get started.</p>
      </section>

      {/* Search Section - same design as landing page */}
      <section className="relative z-20 flex flex-col items-center pb-8">
        <Card className="w-full max-w-7xl mx-auto rounded-[2.5rem] shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
          <CardContent className="p-0">
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row items-center gap-0 md:gap-4"
              style={{
                background: "linear-gradient(90deg, #e0ffe6 0%, #f8fafc 60%, #e0ffe6 100%)",
                borderRadius: "2.5rem",
                boxShadow: "0 8px 32px 0 rgba(34,197,94,0.10)",
                padding: "1.5rem 1.5rem",
                position: "relative",
                top: "-2rem",
                zIndex: 10,
              }}
            >
              {/* Trip Type */}
              <div className="flex flex-col flex-1 min-w-[180px] px-2">
                <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">Trip Type</label>
                <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                  <Select
                    onValueChange={(val) => {
                      setTripTypeId(val);
                      const selected = tripTypes.find((t) => t.id === val);
                      setTripTypeName(selected?.name || "");
                    }}
                    required
                  >
                    <SelectTrigger className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full">
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {tripTypes.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pickup */}
              <div className="flex flex-col flex-1 min-w-[180px] px-2">
                <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">Pickup</label>
                <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                  <Input
                    type="text"
                    placeholder="Pickup location"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    required
                    className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full"
                  />
                </div>
              </div>

              {/* Destination (hide if Airport) */}
              {tripTypeName !== "Airport" && (
                <div className="flex flex-col flex-1 min-w-[180px] px-2">
                  <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">Drop</label>
                  <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                    <Input
                      type="text"
                      placeholder="Destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required={tripTypeName !== "Airport"}
                      className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full"
                    />
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex flex-col flex-1 min-w-[180px] px-2">
                <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">Date</label>
                <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full"
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="flex flex-col flex-1 min-w-[180px] px-2">
                <label className="mb-2 text-xs font-semibold text-green-700 tracking-widest uppercase">Vehicle</label>
                <div className="flex items-center bg-white border-0 rounded-2xl px-3 py-2 shadow-md focus-within:ring-2 focus-within:ring-green-400 transition w-full">
                  <Select
                    onValueChange={(val) => {
                      setVehicleTypeId(val);
                      const selected = vehicleTypes.find((v) => v.id === val);
                      setVehicleTypeName(selected?.name || "");
                    }}
                    required
                  >
                    <SelectTrigger className="border-0 focus:ring-0 h-10 text-base bg-transparent font-medium w-full">
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex flex-col flex-[0.7] min-w-[140px] px-2 mt-6 md:mt-0">
                <Button
                  type="submit"
                  className="h-12 w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-base rounded-2xl shadow-lg font-bold tracking-wide transition-transform hover:scale-105"
                >
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}