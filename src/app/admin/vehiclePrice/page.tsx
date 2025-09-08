"use client"

import { useEffect, useState } from "react"
import {
  getAllPrices,
  addPrice,
  updatePrice,
  deletePrice,
  PriceDetailsByTrip,
  CreatePriceDTO,
} from "@/services/prices/pricesService"
import { getAgents, Agent } from "@/services/admin/agentsService"
import { getVehiclesByAgent, Vehicle } from "@/services/admin/agentVehiclesService"
import { gettripTypes, tripType } from "@/services/admin/tripTypesService"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { toast, Toaster } from "sonner"
import { z } from "zod"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { PageLoader } from "@/components/ui/loader"

export default function VehiclePricePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [tripTypes, setTripTypes] = useState<tripType[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("")
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

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentData, tripTypeData] = await Promise.all([getAgents(), gettripTypes()])
        setAgents(agentData)
        setTripTypes(tripTypeData)
      } catch (err) {
        console.error("Failed to load initial data", err)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedAgent) return
    loadPrices(selectedAgent)
    loadVehicles(selectedAgent)
  }, [selectedAgent])

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

  async function loadVehicles(agentId: string) {
    try {
      const data = await getVehiclesByAgent(agentId)
      setVehicles(data)
    } catch (err) {
      console.error("Failed to fetch vehicles", err)
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
    // Convert all numeric fields to numbers, map empty string to 0
    const numericForm: CreatePriceDTO = {
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
            p.agentVehicleId === numericForm.agentVehicleId && p.tripTypeId === numericForm.tripTypeId
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

      await loadPrices(selectedAgent)
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
      await loadPrices(selectedAgent)
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

  //loader
  if (loading) return <PageLoader />

  return (
    <>
      <Toaster richColors position="top-right" />
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Vehicle Prices Management</h1>

            {/* Agent Selection */}
            {/* Agent Selection */}
            <div className="mb-4 w-64">
              <Select
                value={selectedAgent}          // ✅ Bind the selected value here
                onValueChange={(val) => setSelectedAgent(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {selectedAgent && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Prices for Agent</h2>
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
              </div>
            )}

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
                      disabled={!!editingPrice}   // ✅ Disable Trip Type when editing
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
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
