"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { Clock3, Calendar, ClipboardList, User } from "lucide-react";

import UserHeader from "@/components/user/UserHeader";
import useAuthGuard from "@/components/hooks/useAuthGuard";

interface GroupedBookings {
  date: string;
  items: MyBooking[];
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status?: string): { label: string; className: string } {
  const s = (status || "").toLowerCase();
  if (s.includes("confirm") || s === "approved") return { label: "Confirmed", className: "bg-green-100 text-green-700 border border-green-200" };
  if (s.includes("pending")) return { label: "Pending", className: "bg-amber-100 text-amber-700 border border-amber-200" };
  if (s.includes("cancel")) return { label: "Cancelled", className: "bg-red-100 text-red-700 border red-200" };
  return { label: status || "-", className: "bg-gray-100 text-gray-700 border-gray-200" };
}

function isConfirmed(status?: string) {
  const s = (status || "").toLowerCase();
  return s.includes("confirm") || s === "approved";
}

export default function MyBookingsPage() {
  useAuthGuard();

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

  const onLogout = useCallback(async () => {
    await logout();
    router.push("/login");
  }, [router]);

  const grouped = useMemo<GroupedBookings[]>(() => {
    const groups: Record<string, MyBooking[]> = {};
    for (const b of bookings) {
      const keyDate = new Date((b as any).pickupTime || (b as any).pickupDateTime || b.createdAt || Date.now());
      const key = isNaN(keyDate.getTime()) ? new Date().toDateString() : keyDate.toDateString();
      (groups[key] ||= []).push(b);
    }
    return Object.entries(groups)
      .map(([k, items]) => ({
        date: k,
        items: items.sort(
          (a, b) =>
            new Date((a as any).pickupTime || (a as any).pickupDateTime || 0).getTime() -
            new Date((b as any).pickupTime || (b as any).pickupDateTime || 0).getTime()
        ),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-100 via-white to-green-200">
      <UserHeader onLogout={onLogout} title="My Bookings" />

      <main className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Your Trips</h2>
            <p className="text-gray-600 mt-2">Track and manage your bookings in one place</p>
            <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mt-4" />
          </div>

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

          {!loading && error && (
            <Card className="rounded-2xl border-red-200 bg-red-50">
              <CardContent className="p-6 text-red-700">{error}</CardContent>
            </Card>
          )}

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
                              <TableHead className="hidden md:table-cell text-gray-700">Agent</TableHead>
                              <TableHead className="text-right text-gray-700">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.items.map((b, idx) => {
                              const s = (b.status || "").toLowerCase();
                              const confirmed = s.includes("confirm") || s === "approved";
                              const badge =
                                s.includes("confirm") || s === "approved"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : s.includes("pending")
                                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                                  : s.includes("cancel")
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200";

                              const trip = b.tripTypeName || "Trip";
                              const vehicle = (b as any).agentVehicleName || b.vehicleName || "-";
                              const pickup = b.pickupLocation || "-";
                              const drop = (b as any).dropoffLocation || (b as any).dropLocation || "-";

                              const whenISO = (b as any).pickupTime || (b as any).pickupDateTime;
                              const hasWhen = Boolean(whenISO);
                              const whenCell = hasWhen ? (
                                <div className="flex flex-col text-gray-700 text-sm">
                                  <span className="font-medium">{formatDate(whenISO)}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock3 className="w-4 h-4 text-green-500" />
                                    {formatTime(whenISO)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              );

                              const agentName = (b as any).agentName || (b as any).userName || "-";
                              const agentNumber = (b as any).agentPhone || (b as any).userPhone || (b as any).phone || "-";
                              const agentCell = confirmed ? (
                                <div className="text-sm">
                                  <div className="text-gray-800 font-medium">{agentName}</div>
                                  <div className="text-gray-600">{agentNumber}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              );

                              return (
                                <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-green-50/60"}>
                                  <TableCell className="align-top">
                                    <div className="font-semibold text-gray-800">{trip}</div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell align-top">
                                    <div className="text-gray-800 font-medium">{vehicle}</div>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell align-top">
                                    <div className="text-gray-700 text-sm" title={`${pickup}${drop && drop !== "-" ? ` → ${drop}` : ""}`}>
                                      {pickup}
                                      {drop && drop !== "-" ? <span className="mx-1">→ {drop}</span> : null}
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top">{whenCell}</TableCell>
                                  <TableCell className="hidden md:table-cell align-top">{agentCell}</TableCell>
                                  <TableCell className="text-right align-top">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badge}`}>
                                      {b.status || "-"}
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