"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DataTable } from "@/components/ui/data-table"
import { toast, Toaster } from "sonner"
import { PageLoader } from "@/components/ui/loader"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

// 👉 import the columns ARRAY
import { columns } from "./columns"

// 👉 services
import {
  Vehicle,
  getVehiclesByAgent,
  addAgentVehicle,
  updateAgentVehicle,
  deleteAgentVehicle,
} from "@/services/admin/agentVehiclesService"
import { getVehicleTypes } from "@/services/admin/vehicleTypesService"

//Vehicle Types
type VehicleType = { id: string; name: string }

// Zod schema
const vehicleSchema = z.object({
  name: z.string().min(1, "Vehicle name is required"),
  company: z.string().min(1, "Company is required"),
  seatingCapacity: z.coerce.number<string>().min(0),
})
type VehicleForm = z.infer<typeof vehicleSchema>

export default function AgentVehiclesPage() {
  const [agentId, setAgentId] = useState<string>("")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(true)
  const [vehicleType, setVehicleType] = useState<VehicleType[]>([])

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(vehicleSchema),
  })

  // ✅ get agentId from cookies
  useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("loginId="))
      ?.split("=")[1]

    if (cookieValue) {
      setAgentId(cookieValue)
    } else {
      toast.error("Agent ID not found in cookies.")
    }
  }, [])

  // ✅ load vehicle types
  useEffect(() => {
    getVehicleTypes()
      .then(setVehicleType)
      .catch(() => toast.error("Failed to fetch vehicle types."))
      .finally(() => setLoadingVehicleTypes(false))
  }, [])

  // ✅ load vehicles for this agent
  useEffect(() => {
    if (!agentId) return
    setLoadingVehicles(true)
    getVehiclesByAgent(agentId)
      .then(setVehicles)
      .catch(() => toast.error("Failed to fetch vehicles."))
      .finally(() => setLoadingVehicles(false))
  }, [agentId])

  // Add vehicle
  const onAdd = async (data: VehicleForm) => {
    if (!agentId) return
    try {
      const created = await addAgentVehicle({
        agentId,
        vehicleTypeId: selectedVehicleType,
        name: data.name,
        company: data.company,
        seatingCapacity: data.seatingCapacity,
      })
      setVehicles((prev) => [...prev, created])
      toast.success("Vehicle added successfully!")
      setShowAddDialog(false)
      reset()
      setSelectedVehicleType("")
    } catch {
      toast.error("Failed to add vehicle.")
    }
  }

  // Edit vehicle
  const onEdit = async (data: VehicleForm) => {
    if (!selectedVehicle) return
    try {
      const updated = await updateAgentVehicle(selectedVehicle.id, {
        agentId,
        name: data.name,
        vehicleTypeId: selectedVehicleType,
        company: data.company,
        seatingCapacity: data.seatingCapacity,
      })
      setVehicles((prev) =>
        prev.map((v) => (v.id === selectedVehicle.id ? updated : v))
      )
      toast.success("Vehicle updated successfully!")
      setShowEditDialog(false)
      setSelectedVehicle(null)
      reset()
    } catch {
      toast.error("Failed to update vehicle.")
    }
  }

  // Delete vehicle
  const onDelete = async () => {
    if (!selectedVehicle) return
    try {
      await deleteAgentVehicle(selectedVehicle.id)
      setVehicles((prev) =>
        prev.filter((v) => v.id !== selectedVehicle.id)
      )
      toast.success("Vehicle deleted successfully!")
      setShowDeleteDialog(false)
      setSelectedVehicle(null)
    } catch {
      toast.error("Failed to delete vehicle.")
    }
  }

  // Open dialogs
  const openEditDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setSelectedVehicleType(vehicle.vehicleTypeId)
    reset({
      name: vehicle.name,
      company: vehicle.company,
      seatingCapacity: vehicle.seatingCapacity.toString(),
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowDeleteDialog(true)
  }

  if (loadingVehicles || loadingVehicleTypes) return <PageLoader />

  return (
    <>
      <Toaster richColors position="top-right" />
      
          
          <div className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">My Vehicles</h1>
              <Button onClick={() => { reset(); setShowAddDialog(true) }}>
                Add Vehicle
              </Button>
            </div>

            {/* Vehicles table */}
            {loadingVehicles ? (
              <PageLoader />
            ) : (
              <DataTable
                columns={[
                  ...columns,
                  {
                    id: "actions",
                    header: "Actions",
                    cell: ({ row }) => (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            reset()
                            openEditDialog(row.original)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(row.original)}
                        >
                          Delete
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={vehicles}
              />
            )}

            {/* Add Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Vehicle</DialogTitle>
                </DialogHeader>
                <form
                  className="grid grid-cols-1 gap-4"
                  onSubmit={handleSubmit(onAdd)}
                >
                  <input
                    {...register("name")}
                    placeholder="Name"
                    className="border p-2 rounded"
                  />
                  {errors.name && (
                    <p className="text-red-500">{errors.name.message}</p>
                  )}

                  <input
                    {...register("company")}
                    placeholder="Company"
                    className="border p-2 rounded"
                  />
                  {errors.company && (
                    <p className="text-red-500">{errors.company.message}</p>
                  )}

                  <input
                    type="number"
                    {...register("seatingCapacity")}
                    placeholder="Seating Capacity"
                    className="border p-2 rounded"
                  />
                  {errors.seatingCapacity && (
                    <p className="text-red-500">
                      {errors.seatingCapacity.message}
                    </p>
                  )}

                  {/* Vehicle Type dropdown */}
                  <Select
                    value={selectedVehicleType}
                    onValueChange={setSelectedVehicleType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleType.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <DialogFooter className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Vehicle</DialogTitle>
                </DialogHeader>
                <form
                  className="grid grid-cols-1 gap-4"
                  onSubmit={handleSubmit(onEdit)}
                >
                  <input
                    {...register("name")}
                    placeholder="Name"
                    className="border p-2 rounded"
                  />
                  {errors.name && (
                    <p className="text-red-500">{errors.name.message}</p>
                  )}

                  <input
                    {...register("company")}
                    placeholder="Company"
                    className="border p-2 rounded"
                  />
                  {errors.company && (
                    <p className="text-red-500">{errors.company.message}</p>
                  )}

                  <input
                    type="number"
                    {...register("seatingCapacity")}
                    placeholder="Seating Capacity"
                    className="border p-2 rounded"
                  />
                  {errors.seatingCapacity && (
                    <p className="text-red-500">
                      {errors.seatingCapacity.message}
                    </p>
                  )}

                  {/* Vehicle Type dropdown */}
                  <Select
                    value={selectedVehicleType}
                    onValueChange={setSelectedVehicleType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleType.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <DialogFooter className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Vehicle</DialogTitle>
                </DialogHeader>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{selectedVehicle?.name}</strong>?
                </p>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={onDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        
    </>
  )
}
