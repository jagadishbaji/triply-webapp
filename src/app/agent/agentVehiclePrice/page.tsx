"use client"

import { useEffect, useState } from "react"
import {
  getAllPrices,
  addPrice,
  updatePrice,
  deletePrice,
  PriceDetailsByTrip,
  CreatePriceDetailsByTrip,
} from "@/services/prices/pricesService"
import { getVehiclesByAgent, Vehicle } from "@/services/admin/agentVehiclesService"
import { gettripTypes, tripType } from "@/services/admin/tripTypesService"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { toast, Toaster } from "sonner"
import { z } from "zod"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { PageLoader } from "@/components/ui/loader"
import { getCookie } from "cookies-next"

export default function AgentVehiclePricePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [tripTypes, setTripTypes] = useState<tripType[]>([])
  const [prices, setPrices] = useState<PriceDetailsByTrip[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingPrice, setEditingPrice] = useState<PriceDetailsByTrip | null>(null)

  const [form, setForm] = useState<Record<string, string>>({
    agentVehicleId: "",
    tripTypeId: "",
    localPerKmPrice: "",
    localMinKm: "",
    airportPrice: "",
    outPerKmPrice: "",
    outMinKm: "",
  })

  const agentId = (getCookie("agentId") as string) || (getCookie("loginId") as string) || ""

  useEffect(() => {
    async function fetchData() {
      try {
        const [tripTypeData, vehicleData] = await Promise.all([
          gettripTypes(),
          getVehiclesByAgent(agentId),
        ])
        setTripTypes(tripTypeData)
        setVehicles(vehicleData)
        loadPrices(agentId)
      } catch (err) {
        console.error("Failed to load initial data", err)
      }
    }
    if (agentId) fetchData()
  }, [agentId])

  async function loadPrices(agentId: string) {
    setLoading(true)
    try {
      const data = await getAllPrices()
      setPrices(data.filter((p) => p.agentId === agentId))
    } catch (err) {
      console.error("Failed to fetch prices", err)
    } finally {
      setLoading(false)
    }
  }

  const priceSchema = z
    .object({
      agentVehicleId: z.string().min(1, "Vehicle is required"),
      tripTypeId: z.string().min(1, "Trip Type is required"),
      localPerKmPrice: z.number(),
      localMinKm: z.number(),
      airportPrice: z.number(),
      outPerKmPrice: z.number(),
      outMinKm: z.number(),
    })
    .superRefine((data, ctx) => {
      const tripTypeName = tripTypes.find((tt) => tt.id === data.tripTypeId)?.name
      if (tripTypeName === "Local") {
        if (data.localPerKmPrice <= 0)
          ctx.addIssue({ path: ["localPerKmPrice"], message: "Local Price must be > 0", code: "custom" })
        if (data.localMinKm <= 0)
          ctx.addIssue({ path: ["localMinKm"], message: "Local Min Km must be > 0", code: "custom" })
      } else if (tripTypeName === "Airport") {
        if (data.airportPrice <= 0)
          ctx.addIssue({ path: ["airportPrice"], message: "Airport Price must be > 0", code: "custom" })
      } else if (tripTypeName === "Out Station") {
        if (data.outPerKmPrice <= 0)
          ctx.addIssue({ path: ["outPerKmPrice"], message: "Outstation Price must be > 0", code: "custom" })
        if (data.outMinKm <= 0)
          ctx.addIssue({ path: ["outMinKm"], message: "Outstation Min Km must be > 0", code: "custom" })
      }
    })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSave() {
    const numericForm: CreatePriceDetailsByTrip = {
      agentVehicleId: form.agentVehicleId,
      tripTypeId: form.tripTypeId,
      localPerKmPrice: Number(form.localPerKmPrice) || 0,
      localMinKm: Number(form.localMinKm) || 0,
      airportPrice: Number(form.airportPrice) || 0,
      outPerKmPrice: Number(form.outPerKmPrice) || 0,
      outMinKm: Number(form.outMinKm) || 0,
    }

    const result = priceSchema.safeParse(numericForm)
    if (!result.success) {
      result.error.issues.forEach((issue) => toast.error(issue.message))
      return
    }

    try {
      if (!editingPrice) {
        const duplicate = prices.find(
          (p) =>
            p.agentVehicleId === numericForm.agentVehicleId &&
            p.tripTypeId === numericForm.tripTypeId
        )
        if (duplicate) {
          toast.error("Price already exists for this Vehicle and Trip Type")
          return
        }
        await addPrice(result.data)
        toast.success("Price added")
      } else {
        await updatePrice(editingPrice.id, result.data)
        toast.success("Price updated")
      }

      await loadPrices(agentId)
      setOpenDialog(false)
      setEditingPrice(null)
    } catch (err) {
      console.error("Save failed:", err)
      toast.error("Failed to save price")
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePrice(id)
      await loadPrices(agentId)
      toast.success("Price deleted")
    } catch (err) {
      console.error("Delete failed:", err)
      toast.error("Failed to delete price")
    }
  }

  const columns: ColumnDef<PriceDetailsByTrip>[] = [
    {
      accessorKey: "vehicleName",
      header: "Vehicle",
      cell: ({ row }) => `${row.original.vehicleName} (${row.original.seatingCapacity})`,
    },
    { accessorKey: "tripTypeName", header: "Trip Type" },
    { accessorKey: "localPerKmPrice", header: "Local (₹/km)" },
    { accessorKey: "localMinKm", header: "Local Min Km" },
    { accessorKey: "airportPrice", header: "Airport Price" },
    { accessorKey: "outPerKmPrice", header: "Outstation (₹/km)" },
    { accessorKey: "outMinKm", header: "Outstation Min Km" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingPrice(row.original)
              setForm({
                agentVehicleId: row.original.agentVehicleId,
                tripTypeId: row.original.tripTypeId,
                localPerKmPrice: row.original.localPerKmPrice?.toString() || "",
                localMinKm: row.original.localMinKm?.toString() || "",
                airportPrice: row.original.airportPrice?.toString() || "",
                outPerKmPrice: row.original.outPerKmPrice?.toString() || "",
                outMinKm: row.original.outMinKm?.toString() || "",
              })
              setOpenDialog(true)
            }}
          >
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (loading) return <PageLoader />

  return (
    <>
      <Toaster richColors position="top-right" />
      
          <div className="p-6">
            <h1 className="text-xl font-bold mb-4">My Vehicle Prices</h1>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Prices</h2>
              <Button
                onClick={() => {
                  setForm({
                    agentVehicleId: "",
                    tripTypeId: "",
                    localPerKmPrice: "",
                    localMinKm: "",
                    airportPrice: "",
                    outPerKmPrice: "",
                    outMinKm: "",
                  })
                  setEditingPrice(null)
                  setOpenDialog(true)
                }}
              >
                Add Price
              </Button>
            </div>

            <DataTable columns={columns} data={prices} />

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPrice ? "Edit Price" : "Add Price"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Vehicle Dropdown */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle</label>
                    <Select
                      value={form.agentVehicleId}
                      onValueChange={(val) => setForm({ ...form, agentVehicleId: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} ({v.seatingCapacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Trip Type Dropdown */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Trip Type</label>
                    <Select
                      value={form.tripTypeId}
                      onValueChange={(val) => setForm({ ...form, tripTypeId: val })}
                      disabled={!!editingPrice}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Trip Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {tripTypes.map((tt) => (
                          <SelectItem key={tt.id} value={tt.id}>
                            {tt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional Inputs */}
                  {tripTypes.find((tt) => tt.id === form.tripTypeId)?.name === "Local" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Local Price/Km</label>
                        <Input
                          name="localPerKmPrice"
                          type="number"
                          value={form.localPerKmPrice}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Local Min Km</label>
                        <Input
                          name="localMinKm"
                          type="number"
                          value={form.localMinKm}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {tripTypes.find((tt) => tt.id === form.tripTypeId)?.name === "Airport" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Airport Price</label>
                      <Input
                        name="airportPrice"
                        type="number"
                        value={form.airportPrice}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  {tripTypes.find((tt) => tt.id === form.tripTypeId)?.name === "Out Station" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Outstation Price/Km</label>
                        <Input
                          name="outPerKmPrice"
                          type="number"
                          value={form.outPerKmPrice}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Outstation Min Km</label>
                        <Input
                          name="outMinKm"
                          type="number"
                          value={form.outMinKm}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
       
    </>
  )
}
