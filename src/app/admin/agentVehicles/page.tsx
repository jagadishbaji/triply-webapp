"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ColumnDef } from "@tanstack/react-table"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PageLoader } from "@/components/ui/loader"
import { toast, Toaster } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  IconCar,
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconUsers,
  IconCarCrane,
  IconArmchair,
  IconBuilding,
  IconChevronRight,
} from "@tabler/icons-react"

import {
  Vehicle,
  type CreateVehicleDTO,
  type UpdateVehicleDTO,
  getAgents,
  getVehiclesByAgent,
  addAgentVehicle,
  updateAgentVehicle,
  deleteAgentVehicle,
} from "@/services/admin/agentVehiclesService"
import { getVehicleTypes } from "@/services/admin/vehicleTypesService"

// ─── Local types ───────────────────────────────────────────────────────────
type Agent       = { id: string; name: string }
type VehicleType = { id: string; name: string }

// ─── Zod schema ────────────────────────────────────────────────────────────
const schema = z.object({
  name:            z.string().min(1, "Vehicle name is required"),
  company:         z.string().min(1, "Company / brand is required"),
  seatingCapacity: z.coerce.number().min(1, "Capacity must be at least 1").max(60, "Capacity too high"),
})
type VehicleForm = z.infer<typeof schema>

// ─── Reusable form field ────────────────────────────────────────────────────
function Field({
  label, icon: Icon, error, children,
}: {
  label: string; icon?: React.ElementType; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all
        focus-within:bg-white focus-within:ring-2
        ${error
          ? "border-red-400 bg-red-50/30 focus-within:ring-red-100"
          : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}
      >
        {Icon && <Icon className={`w-4 h-4 mr-2 flex-shrink-0 ${error ? "text-red-400" : "text-slate-400"}`} />}
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  )
}

// ─── Input class ───────────────────────────────────────────────────────────
const inp = "border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 text-slate-800 w-full"

// ─── Main page ─────────────────────────────────────────────────────────────
export default function AgentVehiclesPage() {
  const [agents,         setAgents]         = useState<Agent[]>([])
  const [vehicleTypes,   setVehicleTypes]   = useState<VehicleType[]>([])
  const [vehicles,       setVehicles]       = useState<Vehicle[]>([])
  const [filtered,       setFiltered]       = useState<Vehicle[]>([])

  const [selectedAgentId,    setSelectedAgentId]    = useState("")
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState("")
  const [search,             setSearch]             = useState("")

  const [loadingAgents,   setLoadingAgents]   = useState(true)
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  // Single dialog state
  const [dialog,    setDialog]    = useState<"add" | "edit" | "delete" | null>(null)
  const [selected,  setSelected]  = useState<Vehicle | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form
  const { register, handleSubmit, formState: { errors }, reset } = useForm<VehicleForm>({
    resolver: zodResolver(schema),
  })

  // ── Load agents + vehicle types on mount ────────────────────────────
  useEffect(() => {
    Promise.all([getAgents(), getVehicleTypes()])
      .then(([a, vt]) => {
        setAgents(a || [])
        setVehicleTypes(vt || [])
      })
      .catch(() => toast.error("Failed to load initial data."))
      .finally(() => setLoadingAgents(false))
  }, [])

  // ── Load vehicles when agent changes ────────────────────────────────
  const fetchVehicles = useCallback(async (agentId: string) => {
    if (!agentId) { setVehicles([]); setFiltered([]); return }
    setLoadingVehicles(true)
    try {
      const data = await getVehiclesByAgent(agentId)
      setVehicles(data || [])
      setFiltered(data || [])
    } catch {
      toast.error("Failed to fetch vehicles.")
    } finally {
      setLoadingVehicles(false)
    }
  }, [])

  useEffect(() => { fetchVehicles(selectedAgentId) }, [selectedAgentId, fetchVehicles])

  // ── Search filter ────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase().trim()
    setFiltered(
      q
        ? vehicles.filter(v =>
            v.name.toLowerCase().includes(q) ||
            v.company.toLowerCase().includes(q)
          )
        : vehicles
    )
  }, [search, vehicles])

  // ── Helpers ──────────────────────────────────────────────────────────
  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  const closeDialog = () => {
    setDialog(null)
    setSelected(null)
    setSelectedVehicleTypeId("")
  }

  const openAdd = () => {
    reset({ name: "", company: "", seatingCapacity: undefined })
    setSelectedVehicleTypeId("")
    setDialog("add")
  }

  const openEdit = (vehicle: Vehicle) => {
    setSelected(vehicle)
    setSelectedVehicleTypeId(vehicle.vehicleTypeId || "")
    reset({
      name:            vehicle.name,
      company:         vehicle.company,
      seatingCapacity: vehicle.seatingCapacity,
    })
    setDialog("edit")
  }

  const openDelete = (vehicle: Vehicle) => {
    setSelected(vehicle)
    setDialog("delete")
  }

  // ── CRUD ─────────────────────────────────────────────────────────────
  const onAdd = async (data: VehicleForm) => {
    if (!selectedAgentId) { toast.error("Please select an agent first."); return }
    if (!selectedVehicleTypeId) { toast.error("Please select a vehicle type."); return }
    setSubmitting(true)
    try {
      const created = await addAgentVehicle({
        agentId:         selectedAgentId,
        vehicleTypeId:   selectedVehicleTypeId,
        name:            data.name,
        company:         data.company,
        seatingCapacity: data.seatingCapacity,
      })
      setVehicles(prev => [...prev, created])
      toast.success(`Vehicle "${data.name}" added successfully.`)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to add vehicle.")
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async (data: VehicleForm) => {
    if (!selected) return
    if (!selectedVehicleTypeId) { toast.error("Please select a vehicle type."); return }
    setSubmitting(true)
    try {
      const updated = await updateAgentVehicle(selected.id, {
        agentId:         selected.agentId,
        vehicleTypeId:   selectedVehicleTypeId,
        name:            data.name,
        company:         data.company,
        seatingCapacity: data.seatingCapacity,
      })
      setVehicles(prev => prev.map(v => v.id === selected.id ? updated : v))
      toast.success(`Vehicle "${data.name}" updated successfully.`)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update vehicle.")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await deleteAgentVehicle(selected.id)
      setVehicles(prev => prev.filter(v => v.id !== selected.id))
      toast.success(`Vehicle "${selected.name}" deleted.`)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete vehicle.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Vehicle type name lookup ─────────────────────────────────────────
  const getTypeName = (typeId: string) =>
    vehicleTypes.find(vt => vt.id === typeId)?.name ?? "—"

  // ── Table columns ────────────────────────────────────────────────────
  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: "name",
      header: "Vehicle",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <IconCar className="w-4 h-4 text-green-700" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">{row.original.name}</div>
            <div className="text-xs text-slate-500">{row.original.company}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "vehicleTypeId",
      header: "Type",
      cell: ({ row }) => (
        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
          {getTypeName(row.original.vehicleTypeId)}
        </Badge>
      ),
    },
    {
      accessorKey: "seatingCapacity",
      header: "Capacity",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-700">
          <IconArmchair className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">{row.original.seatingCapacity}</span>
          <span className="text-slate-400 text-xs">seats</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm" variant="outline"
            className="h-8 px-3 text-xs border-slate-200 text-slate-600 hover:text-green-700 hover:border-green-300 rounded-lg font-semibold flex items-center gap-1"
            onClick={() => openEdit(row.original)}
          >
            <IconPencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button
            size="sm" variant="outline"
            className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-semibold flex items-center gap-1"
            onClick={() => openDelete(row.original)}
          >
            <IconTrash className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      ),
    },
  ]

  if (loadingAgents) return <PageLoader />

  // unique companies in current vehicle list
  const uniqueCompanies = [...new Set(vehicles.map(v => v.company))].length

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

          <div className="flex flex-1 flex-col p-6 bg-slate-50 min-h-full">

            {/* ── Page header ─────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Agent Vehicles</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manage vehicles listed by each operator
                </p>
              </div>
              <Button
                onClick={openAdd}
                disabled={!selectedAgentId}
                title={!selectedAgentId ? "Select an agent first" : "Add vehicle"}
                className="bg-green-600 hover:bg-green-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-green-500/20 flex items-center gap-2 h-10 px-5 self-start sm:self-auto"
              >
                <IconPlus className="w-4 h-4" /> Add Vehicle
              </Button>
            </div>

            {/* ── Agent selector card ─────────────────────────────── */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 shadow-sm">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Select Agent
              </Label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all min-w-[260px]">
                  <IconUsers className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <Select value={selectedAgentId} onValueChange={(v) => { setSelectedAgentId(v); setSearch("") }}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm focus:ring-0 shadow-none flex-1">
                      <SelectValue placeholder="Choose an agent to view their vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAgentId && (
                  <Button
                    variant="outline"
                    onClick={() => fetchVehicles(selectedAgentId)}
                    className="h-11 px-4 border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-2"
                  >
                    <IconRefresh className="w-4 h-4" /> Refresh
                  </Button>
                )}

                {/* Selected agent breadcrumb */}
                {selectedAgent && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 ml-auto">
                    <IconUsers className="w-4 h-4 text-green-500" />
                    <span>Viewing vehicles for</span>
                    <span className="font-bold text-slate-800">{selectedAgent.name}</span>
                    <IconChevronRight className="w-3.5 h-3.5" />
                    <span className="font-bold text-green-700">{vehicles.length} vehicles</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Stats (only when agent selected) ───────────────── */}
            {selectedAgentId && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <StatCard label="Total Vehicles"    value={vehicles.length}  icon={IconCar}      color="bg-slate-700" />
                <StatCard label="Vehicle Types"     value={[...new Set(vehicles.map(v => v.vehicleTypeId))].length} icon={IconCarCrane}  color="bg-blue-600" />
                <StatCard label="Brands / Companies" value={uniqueCompanies} icon={IconBuilding} color="bg-green-600" />
              </div>
            )}

            {/* ── No agent selected ───────────────────────────────── */}
            {!selectedAgentId && (
              <div className="bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center py-20 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <IconUsers className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-700 font-bold text-lg mb-1">Select an Agent</h3>
                <p className="text-slate-400 text-sm max-w-xs">
                  Choose an agent from the dropdown above to view and manage their vehicle listings.
                </p>
              </div>
            )}

            {/* ── Search + Table ─────────────────────────────────── */}
            {selectedAgentId && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 h-10 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all">
                    <IconSearch className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search by vehicle name or company..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-800"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 ml-2 text-sm">✕</button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {loadingVehicles ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <IconRefresh className="w-7 h-7 animate-spin" />
                        <span className="text-sm">Loading vehicles...</span>
                      </div>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <IconCar className="w-7 h-7 text-slate-400" />
                      </div>
                      <h3 className="text-slate-700 font-bold mb-1">
                        {search ? "No vehicles match your search" : "No vehicles listed yet"}
                      </h3>
                      <p className="text-slate-400 text-sm mb-4 max-w-xs">
                        {search
                          ? "Try a different search term."
                          : `${selectedAgent?.name} hasn't listed any vehicles. Click "Add Vehicle" to add one.`}
                      </p>
                      {!search && (
                        <Button
                          onClick={openAdd}
                          className="bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold px-5 h-9 text-sm flex items-center gap-2"
                        >
                          <IconPlus className="w-4 h-4" /> Add First Vehicle
                        </Button>
                      )}
                    </div>
                  ) : (
                    <DataTable columns={columns} data={filtered} />
                  )}
                </div>
              </>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* ════════════════════════════════════════════════════════════
          ADD DIALOG
      ════════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "add"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <IconPlus className="w-4 h-4 text-green-700" />
                </div>
                Add Vehicle
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Adding a vehicle for <strong className="text-slate-700">{selectedAgent?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onAdd)} className="flex flex-col gap-4">
              {/* Vehicle type */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-slate-700">Vehicle Type</Label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all">
                  <IconCarCrane className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <Select value={selectedVehicleTypeId} onValueChange={setSelectedVehicleTypeId}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm focus:ring-0 shadow-none flex-1">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(vt => (
                        <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Field label="Vehicle Name" icon={IconCar} error={errors.name?.message}>
                <Input placeholder="e.g. Swift Dzire, Innova Crysta" {...register("name")} className={inp} />
              </Field>

              <Field label="Company / Brand" icon={IconBuilding} error={errors.company?.message}>
                <Input placeholder="e.g. Maruti, Toyota, Mahindra" {...register("company")} className={inp} />
              </Field>

              <Field label="Seating Capacity" icon={IconArmchair} error={errors.seatingCapacity?.message}>
                <Input type="number" min={1} max={60} placeholder="e.g. 5" {...register("seatingCapacity")} className={inp} />
              </Field>

              

              <DialogFooter className="gap-2 mt-2">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting} className="rounded-xl border-slate-200">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold px-6">
                  {submitting ? "Adding..." : "Add Vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════
          EDIT DIALOG
      ════════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "edit"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <IconPencil className="w-4 h-4 text-blue-700" />
                </div>
                Edit Vehicle
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Editing <strong className="text-slate-700">{selected?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onEdit)} className="flex flex-col gap-4">
              {/* Vehicle type */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-slate-700">Vehicle Type</Label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                  <IconCarCrane className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <Select value={selectedVehicleTypeId} onValueChange={setSelectedVehicleTypeId}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm focus:ring-0 shadow-none flex-1">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(vt => (
                        <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Field label="Vehicle Name" icon={IconCar} error={errors.name?.message}>
                <Input placeholder="Vehicle name" {...register("name")} className={inp} />
              </Field>

              <Field label="Company / Brand" icon={IconBuilding} error={errors.company?.message}>
                <Input placeholder="Company or brand" {...register("company")} className={inp} />
              </Field>

              <Field label="Seating Capacity" icon={IconArmchair} error={errors.seatingCapacity?.message}>
                <Input type="number" min={1} max={60} {...register("seatingCapacity")} className={inp} />
              </Field>

              
              <DialogFooter className="gap-2 mt-2">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting} className="rounded-xl border-slate-200">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold px-6">
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════
          DELETE DIALOG
      ════════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "delete"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-500 to-red-400" />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <IconTrash className="w-4 h-4 text-red-600" />
                </div>
                Delete Vehicle
              </DialogTitle>
            </DialogHeader>

            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-red-700">
                Permanently delete <strong>{selected?.name}</strong> ({selected?.company})?
                Any prices linked to this vehicle will also be removed.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={submitting} className="rounded-xl border-slate-200 flex-1">
                Cancel
              </Button>
              <Button onClick={onDelete} disabled={submitting} className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex-1">
                {submitting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}