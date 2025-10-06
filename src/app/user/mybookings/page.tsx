"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getCookie } from "cookies-next";

import { myBookings, MyBooking } from "@/services/bookingService";
import { logout } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { Car, Clock3, MapPin, Calendar, ArrowLeft, ClipboardList, User, LogOut } from "lucide-react";

interface GroupedBookings {
  date: string;
  items: MyBooking[];
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status?: string): { label: string; className: string } {
  const s = (status || "").toLowerCase();
  if (s.includes("confirm") || s === "approved") return { label: "Confirmed", className: "bg-green-100 text-green-700 border border-green-200" };
  if (s.includes("pending")) return { label: "Pending", className: "bg-amber-100 text-amber-700 border border-amber-200" };
  if (s.includes("cancel")) return { label: "Cancelled", className: "bg-red-100 text-red-700 border border-red-200" };
  return { label: status || "-", className: "bg-gray-100 text-gray-700 border border-gray-200" };
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<MyBooking[]>([]);

  useEffect(() => {
    const token = getCookie("accessToken") as string | undefined;
    if (!token) {
      router.push("/login?redirect=/user/mybookings");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await myBookings();
        setBookings(data || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const grouped = useMemo<GroupedBookings[]>(() => {
    const groups: Record<string, MyBooking[]> = {};
    for (const b of bookings) {
      const key = new Date(b.pickupDateTime || b.createdAt || Date.now()).toDateString();
      (groups[key] ||= []).push(b);
    }
    return Object.entries(groups)
      .map(([k, items]) => ({
        date: k,
        items: items.sort((a, b) => new Date(a.pickupDateTime || 0).getTime() - new Date(b.pickupDateTime || 0).getTime()),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-100 via-white to-green-200">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-6 md:px-10 py-4 bg-white/90 backdrop-blur-md shadow-xl rounded-3xl border border-green-100 mx-4 mt-4 sticky top-0 z-30"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-xl text-green-700 hover:bg-green-50" asChild>
            <Link href="/user/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">My Bookings</span>
          </h1>
        </div>
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
            onClick={async () => { await logout(); router.push("/login"); }}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
          <Link href="/user/vehicles">
            <Button className="rounded-xl bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white">
              Book a Ride
            </Button>
          </Link>
        </nav>
      </motion.header>

      {/* Content */}
      <main className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          {/* Title + Sub */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Your Trips</h2>
            <p className="text-gray-600 mt-2">Track and manage your bookings in one place</p>
            <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mt-4" />
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-44 mb-2" />
                          <Skeleton className="h-3 w-72" />
                        </div>
                      </div>
                      <Skeleton className="h-9 w-24 rounded-xl" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <Card className="rounded-2xl border-red-200 bg-red-50">
              <CardContent className="p-6 text-red-700">{error}</CardContent>
            </Card>
          )}

          {/* Empty */}
          {!loading && !error && bookings.length === 0 && (
            <Card className="rounded-3xl shadow-2xl overflow-hidden border-0">
              <CardContent className="p-12 text-center bg-white/90">
                <ClipboardList className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">Start your journey by booking your first ride.</p>
                <Link href="/user/vehicles">
                  <Button className="rounded-xl bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white">
                    Browse Vehicles
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Table List */}
          {!loading && !error && bookings.length > 0 && (
            <div className="space-y-10">
              {grouped.map((group) => (
                <section key={group.date}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{group.date}</h3>
                  </div>

                  <Card className="rounded-2xl overflow-hidden shadow-xl border-0">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-100">
                              <TableHead className="text-gray-700">Trip</TableHead>
                              <TableHead className="hidden md:table-cell text-gray-700">Vehicle</TableHead>
                              <TableHead className="hidden lg:table-cell text-gray-700">Route</TableHead>
                              <TableHead className="text-gray-700">When</TableHead>
                              <TableHead className="text-right text-gray-700">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.items.map((b, idx) => {
                              const v = statusBadge(b.status);
                              return (
                                <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-green-50/60"}>
                                  <TableCell className="align-top">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-xl bg-green-50 border border-green-100">
                                        <Car className="w-5 h-5 text-green-600" />
                                      </div>
                                      <div>
                                        <div className="font-semibold text-gray-800">{b.tripTypeName || "Trip"}</div>
                                        <div className="text-gray-500 text-xs">ID: {b.bookingId || b.id}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell align-top">
                                    <div className="text-gray-800 font-medium">{b.agentVehicleName || b.vehicleName || "-"}</div>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell align-top">
                                    <div className="text-gray-700 text-sm flex items-center gap-1">
                                      <MapPin className="w-4 h-4 text-green-500" />
                                      <span className="truncate max-w-[260px]" title={`${b.pickupLocation || "-"} ${b.dropLocation ? `→ ${b.dropLocation}` : ""}`}>
                                        {b.pickupLocation || "-"}
                                        {b.dropLocation ? <span className="mx-1">→ {b.dropLocation}</span> : null}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="flex flex-col text-gray-700 text-sm">
                                      <span className="font-medium">{formatDate(b.pickupDateTime)}</span>
                                      <span className="flex items-center gap-1"><Clock3 className="w-4 h-4 text-green-500" />{formatTime(b.pickupDateTime)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right align-top">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${v.className}`}>
                                      {v.label}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
