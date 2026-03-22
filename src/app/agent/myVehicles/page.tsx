"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { getCookie } from "cookies-next"
import { toast, Toaster } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Car,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Shield,
  Tag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Vehicle,
  getVehiclesByAgent,
  addAgentVehicle,
  updateAgentVehicle,
  deleteAgentVehicle,
} from "@/services/admin/agentVehiclesService"
import {
  getVehicleTypes,
  vehicleType,
} from "@/services/admin/vehicleTypesService"

// ── Schema ─────────────────────────────────────────────────────────────────
const vehicleSchema = z.object({
  name: z.string().min(2, "Vehicle name is required"),
  company: z.string().min(1, "Brand / company is required"),
  seatingCapacity: z.coerce
    .number()
    .min(1, "Seats must be at least 1")
    .max(60, "Seats cannot exceed 60"),
  vehicleTypeId: z.string().min(1, "Select a vehicle type"),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

// ── Types ──────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string
  error?: string
  children: React.ReactNode
}

interface VehicleCardProps {
  vehicle: Vehicle
  vehicleTypes: vehicleType[]
  onEdit: (v: Vehicle) => void
  onDelete: (id: string) => void
  deleting: string | null
}

interface VehicleDrawerProps {
  open: boolean
  onClose: () => void
  onSave: (data: VehicleFormData) => Promise<void>
  vehicleTypes: vehicleType[]
  vehicleTypesLoading: boolean
  editing: Vehicle | null
}

interface DeleteConfirmProps {
  vehicle: Vehicle
  onConfirm: () => void
  onCancel: () => void
}

// ── Field wrapper ──────────────────────────────────────────────────────────
function Field({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600">{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

// ── Vehicle card ───────────────────────────────────────────────────────────
function VehicleCard({
  vehicle,
  vehicleTypes,
  onEdit,
  onDelete,
  deleting,
}: VehicleCardProps) {
  const typeName =
    vehicleTypes.find((t) => t.id === vehicle.vehicleTypeId)?.name ?? "—"
  const isDeleting = deleting === vehicle.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-green-200 transition-all duration-200"
    >
      {/* Top bar */}
      <div className="bg-gradient-to-r from-slate-50 to-green-50 px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="font-black text-slate-900 text-sm">
              {vehicle.name}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {vehicle.company}
            </div>
          </div>
        </div>
        {vehicle.isActive ? (
          <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active
          </Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold">
            Inactive
          </Badge>
        )}
      </div>

      {/* Details */}
      <div className="px-5 py-4 grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-1">
            <Users className="w-3 h-3" /> Seats
          </div>
          <div className="font-black text-slate-900">
            {vehicle.seatingCapacity}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-1">
            <Tag className="w-3 h-3" /> Vehicle Type
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">
            {typeName}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(vehicle)}
          className="flex-1 h-9 rounded-xl border-slate-200 text-slate-700 font-semibold hover:border-green-300 hover:text-green-700"
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(vehicle.id)}
          disabled={isDeleting}
          className="flex-1 h-9 rounded-xl border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}

// ── Add/Edit Drawer ────────────────────────────────────────────────────────
function VehicleDrawer({
  open,
  onClose,
  onSave,
  vehicleTypes,
  vehicleTypesLoading,
  editing,
}: VehicleDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      company: "",
      seatingCapacity: 1,
      vehicleTypeId: "",
    },
  })

  // Reset form when drawer opens/closes or editing changes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        reset({
          name: "",
          company: "",
          seatingCapacity: 1,
          vehicleTypeId: "",
        })
        setSaved(false)
      }, 300)
      return () => clearTimeout(timer)
    }

    if (editing) {
      reset({
        name: editing.name,
        company: editing.company,
        seatingCapacity: editing.seatingCapacity,
        vehicleTypeId: editing.vehicleTypeId,
      })
    } else {
      reset({
        name: "",
        company: "",
        seatingCapacity: 1,
        vehicleTypeId: "",
      })
    }
    setSaved(false)
  }, [open, editing, reset])

  const onSubmit = async (data: VehicleFormData) => {
    setSaving(true)
    try {
      await onSave(data)
      setSaved(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save vehicle."
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const inputClassName =
    "h-11 border-slate-200 bg-slate-50 rounded-xl text-sm focus-visible:border-green-500 focus-visible:ring-2 focus-visible:ring-green-100 focus-visible:bg-white transition-all"

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editing ? "Edit Vehicle" : "Add Vehicle"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editing
                    ? `Editing: ${editing.name}`
                    : "Add a new vehicle to your fleet"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {saved ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-bold text-slate-900">
                    {editing ? "Vehicle updated!" : "Vehicle added!"}
                  </p>
                </div>
              ) : (
                <form
                  id="vehicle-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Vehicle Type - Using Controller for proper Select binding */}
                  <Field
                    label="Vehicle Type *"
                    error={errors.vehicleTypeId?.message}
                  >
                    <Controller
                      name="vehicleTypeId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={vehicleTypesLoading}
                        >
                          <SelectTrigger className={`${inputClassName} w-full`}>
                            <SelectValue
                              placeholder={
                                vehicleTypesLoading
                                  ? "Loading vehicle types..."
                                  : "Select vehicle type (e.g. Sedan, SUV)"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleTypes.length === 0 && !vehicleTypesLoading ? (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                No vehicle types available
                              </div>
                            ) : (
                              vehicleTypes.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  <span className="flex items-center gap-2">
                                    {t.iconEmoji && <span>{t.iconEmoji}</span>}
                                    <span>{t.name}</span>
                                    {t.maxSeats && (
                                      <span className="text-slate-400">
                                        · up to {t.maxSeats} seats
                                      </span>
                                    )}
                                  </span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  {/* Vehicle Name */}
                  <Field label="Vehicle Name *" error={errors.name?.message}>
                    <Input
                      {...register("name")}
                      placeholder="e.g. Swift Dzire, Innova 2023"
                      className={inputClassName}
                    />
                  </Field>

                  {/* Brand / Company */}
                  <Field
                    label="Brand / Manufacturer *"
                    error={errors.company?.message}
                  >
                    <Input
                      {...register("company")}
                      placeholder="e.g. Maruti Suzuki, Toyota, Mahindra"
                      className={inputClassName}
                    />
                  </Field>

                  {/* Seating Capacity */}
                  <Field
                    label="Seating Capacity *"
                    error={errors.seatingCapacity?.message}
                  >
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        {...register("seatingCapacity")}
                        placeholder="e.g. 5"
                        className={inputClassName}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        seats
                      </div>
                    </div>
                  </Field>

                  {/* Info note */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      After adding the vehicle, go to{" "}
                      <strong>Vehicle Prices</strong> to set pricing so
                      customers can find and book this vehicle.
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {!saved && (
              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
                <Button
                  type="submit"
                  form="vehicle-form"
                  disabled={saving || vehicleTypesLoading}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/25 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                    </>
                  ) : editing ? (
                    "Update Vehicle"
                  ) : (
                    "Add Vehicle"
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Delete confirm ─────────────────────────────────────────────────────────
function DeleteConfirm({ vehicle, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-black text-slate-900 text-center mb-2">
          Delete Vehicle?
        </h3>
        <p className="text-sm text-slate-500 text-center mb-1">
          <strong className="text-slate-700">{vehicle.name}</strong> will be
          removed from your fleet.
        </p>
        <p className="text-xs text-slate-400 text-center mb-6">
          Existing bookings for this vehicle will not be affected.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            Delete
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AgentMyVehiclesPage() {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [isAgentIdLoaded, setIsAgentIdLoaded] = useState(false)
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<vehicleType[]>([])
  
  const [loading, setLoading] = useState(true)
  const [vehicleTypesLoading, setVehicleTypesLoading] = useState(true)
  const [error, setError] = useState("")

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const hasInitializedVehicles = useRef(false)
  const hasInitializedTypes = useRef(false)

  // Load agent ID from cookies on mount
  useEffect(() => {
    const loadAgentId = () => {
      try {
        const agentIdCookie = getCookie("agentId")
        const loginIdCookie = getCookie("loginId")
        const id = (agentIdCookie || loginIdCookie) as string | undefined
        setAgentId(id || null)
      } catch (err) {
        console.error("Failed to read cookies:", err)
        setAgentId(null)
      } finally {
        setIsAgentIdLoaded(true)
      }
    }

    loadAgentId()
  }, [])

  // Load vehicle types independently (doesn't depend on agentId)
  const loadVehicleTypes = useCallback(async () => {
    if (hasInitializedTypes.current) return
    
    setVehicleTypesLoading(true)
    try {
      const typesData = await getVehicleTypes()
      setVehicleTypes(typesData ?? [])
      hasInitializedTypes.current = true
    } catch (err) {
      console.error("Failed to load vehicle types:", err)
      toast.error("Failed to load vehicle types")
    } finally {
      setVehicleTypesLoading(false)
    }
  }, [])

  // Load vehicle types on mount
  useEffect(() => {
    loadVehicleTypes()
  }, [loadVehicleTypes])

  // Load vehicles (depends on agentId)
  const loadVehicles = useCallback(async () => {
    if (!agentId) {
      setError("Agent session not found. Please log in again.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    try {
      const vehiclesData = await getVehiclesByAgent(agentId)
      setVehicles(vehiclesData ?? [])
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load vehicles"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [agentId])

  // Trigger load vehicles when agentId is available
  useEffect(() => {
    if (!isAgentIdLoaded) return

    if (agentId && !hasInitializedVehicles.current) {
      hasInitializedVehicles.current = true
      loadVehicles()
    } else if (!agentId) {
      setLoading(false)
      setError("Agent session not found. Please log in again.")
    }
  }, [agentId, isAgentIdLoaded, loadVehicles])

  const openAdd = useCallback(() => {
    setEditing(null)
    setDrawerOpen(true)
  }, [])

  const openEdit = useCallback((v: Vehicle) => {
    setEditing(v)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditing(null)
  }, [])

  const handleSave = useCallback(
    async (data: VehicleFormData) => {
      if (!agentId) {
        throw new Error("Agent session not found")
      }

      if (editing) {
        const updated = await updateAgentVehicle(editing.id, {
          name: data.name,
          company: data.company,
          seatingCapacity: data.seatingCapacity,
          vehicleTypeId: data.vehicleTypeId,
        })
        setVehicles((prev) =>
          prev.map((v) => (v.id === editing.id ? updated : v))
        )
        toast.success(`"${data.name}" updated successfully.`)
      } else {
        const created = await addAgentVehicle({
          agentId,
          vehicleTypeId: data.vehicleTypeId,
          name: data.name,
          company: data.company,
          seatingCapacity: data.seatingCapacity,
        })
        setVehicles((prev) => [...prev, created])
        toast.success(`"${data.name}" added to your fleet.`)
      }
    },
    [agentId, editing]
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteVehicle) return

    const vehicleToDelete = deleteVehicle
    setDeleting(vehicleToDelete.id)
    setDeleteVehicle(null)

    try {
      await deleteAgentVehicle(vehicleToDelete.id)
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleToDelete.id))
      toast.success(`"${vehicleToDelete.name}" removed from your fleet.`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete vehicle."
      toast.error(errorMessage)
    } finally {
      setDeleting(null)
    }
  }, [deleteVehicle])

  const handleDeleteClick = useCallback(
    (id: string) => {
      const found = vehicles.find((x) => x.id === id)
      if (found) setDeleteVehicle(found)
    },
    [vehicles]
  )

  const handleRetry = useCallback(() => {
    hasInitializedVehicles.current = false
    hasInitializedTypes.current = false
    loadVehicleTypes()
    loadVehicles()
  }, [loadVehicles, loadVehicleTypes])

  // Stats
  const activeCount = vehicles.filter((v) => v.isActive).length
  const inactiveCount = vehicles.length - activeCount

  // Show loading while reading cookies
  if (!isAgentIdLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster richColors position="top-right" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">My Vehicles</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your fleet — add, edit or remove vehicles
            </p>
          </div>
          <Button
            onClick={openAdd}
            disabled={loading || !agentId}
            className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/25"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        </div>

        {/* Stats */}
        {!loading && vehicles.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: "Total Vehicles",
                value: vehicles.length,
                color: "text-slate-900",
              },
              { label: "Active", value: activeCount, color: "text-green-700" },
              {
                label: "Inactive",
                value: inactiveCount,
                color: "text-slate-500",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-100 p-4 text-center"
              >
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* No agent id */}
        {!agentId && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              Session expired. Please{" "}
              <a href="/login" className="underline font-bold">
                log in again
              </a>
              .
            </p>
          </div>
        )}

        {/* Error */}
        {error && agentId && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="text-xs font-bold text-red-600 underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse"
              >
                <div className="h-20 bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-14 bg-slate-100 rounded-xl" />
                    <div className="h-14 bg-slate-100 rounded-xl" />
                  </div>
                  <div className="h-9 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && vehicles.length === 0 && agentId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-5">
              <Car className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">
              No vehicles yet
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
              Add your first vehicle to start accepting cab bookings on
              NammaCab.
            </p>
            <Button
              onClick={openAdd}
              className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6"
            >
              <Plus className="w-4 h-4 mr-2" /> Add First Vehicle
            </Button>
          </motion.div>
        )}

        {/* Vehicle cards */}
        {!loading && vehicles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  vehicleTypes={vehicleTypes}
                  onEdit={openEdit}
                  onDelete={handleDeleteClick}
                  deleting={deleting}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Info footer */}
        {!loading && vehicles.length > 0 && (
          <div className="mt-8 bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Remember to set{" "}
              <strong className="text-slate-700">Vehicle Prices</strong> for
              each vehicle and trip type. Vehicles without pricing will not
              appear in customer search results.
            </p>
          </div>
        )}
      </div>

      {/* Drawer */}
      <VehicleDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        onSave={handleSave}
        vehicleTypes={vehicleTypes}
        vehicleTypesLoading={vehicleTypesLoading}
        editing={editing}
      />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteVehicle && (
          <DeleteConfirm
            vehicle={deleteVehicle}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteVehicle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}