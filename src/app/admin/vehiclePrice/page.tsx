"use client"

import { useEffect, useState, useCallback } from "react"
import { z } from "zod"
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconCoinBitcoin,
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconUsers,
  IconCar,
  IconRoute,
  IconMapPin,
  IconPlane,
  IconChevronRight,
  IconAlertTriangle,
} from "@tabler/icons-react"

import {
  getAllPrices,
  addPrice,
  updatePrice,
  deletePrice,
  PriceDetailsByTrip,
  CreatePriceDetailsByTrip,
} from "@/services/prices/pricesService"
import { getAgents, Agent } from "@/services/admin/agentsService"
import { getVehiclesByAgent, Vehicle } from "@/services/admin/agentVehiclesService"
import { gettripTypes, tripType } from "@/services/admin/tripTypesService"

// ─── Trip type config ───────────────────────────────────────────────────────
const TRIP_ICONS: Record<string, React.ElementType> = {
  Local:       IconMapPin,
  Airport:     IconPlane,
  "Out Station": IconRoute,
}

const TRIP_COLORS: Record<string, string> = {
  Local:         "bg-green-50 text-green-700 border-green-200",
  Airport:       "bg-blue-50 text-blue-700 border-blue-200",
  "Out Station": "bg-purple-50 text-purple-700 border-purple-200",
}

// ─── Form state shape ───────────────────────────────────────────────────────
interface FormState {
  agentVehicleId: string
  tripTypeId:     string
  localPerKmPrice: string
  localMinKm:      string
  airportPrice:    string
  outPerKmPrice:   string
  outMinKm:        string
}

const EMPTY_FORM: FormState = {
  agentVehicleId:  "",
  tripTypeId:      "",
  localPerKmPrice: "",
  localMinKm:      "",
  airportPrice:    "",
  outPerKmPrice:   "",
  outMinKm:        "",
}

// ─── Zod validation (conditional per trip type) ─────────────────────────────
function buildSchema(tripTypeName: string) {
  return z.object({
    agentVehicleId:  z.string().min(1, "Vehicle is required"),
    tripTypeId:      z.string().min(1, "Trip type is required"),
    localPerKmPrice: z.coerce.number(),
    localMinKm:      z.coerce.number(),
    airportPrice:    z.coerce.number(),
    outPerKmPrice:   z.coerce.number(),
    outMinKm:        z.coerce.number(),
  }).superRefine((data, ctx) => {
    if (tripTypeName === "Local") {
      if (!data.localPerKmPrice || data.localPerKmPrice <= 0)
        ctx.addIssue({ path: ["localPerKmPrice"], message: "Local price per km must be greater than 0", code: "custom" })
      if (!data.localMinKm || data.localMinKm <= 0)
        ctx.addIssue({ path: ["localMinKm"], message: "Minimum km must be greater than 0", code: "custom" })
    } else if (tripTypeName === "Airport") {
      if (!data.airportPrice || data.airportPrice <= 0)
        ctx.addIssue({ path: ["airportPrice"], message: "Airport price must be greater than 0", code: "custom" })
    } else if (tripTypeName === "Out Station") {
      if (!data.outPerKmPrice || data.outPerKmPrice <= 0)
        ctx.addIssue({ path: ["outPerKmPrice"], message: "Outstation price per km must be greater than 0", code: "custom" })
      if (!data.outMinKm || data.outMinKm <= 0)
        ctx.addIssue({ path: ["outMinKm"], message: "Minimum km must be greater than 0", code: "custom" })
    }
  })
}

// ─── Reusable price input field ─────────────────────────────────────────────
function PriceField({
  label, name, value, onChange, prefix = "₹", suffix, hint, error,
}: {
  label: string
  name: keyof FormState
  value: string
  onChange: (name: keyof FormState, val: string) => void
  prefix?: string
  suffix?: string
  hint?: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className={`flex items-center bg-slate-50 border rounded-xl h-11 overflow-hidden transition-all
        focus-within:bg-white focus-within:ring-2
        ${error
          ? "border-red-400 bg-red-50/30 focus-within:ring-red-100"
          : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"
        }`}
      >
        {prefix && (
          <span className="px-3 text-sm font-bold text-slate-500 bg-slate-100 border-r border-slate-200 h-full flex items-center">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="border-0 bg-transparent px-3 h-full text-sm focus-visible:ring-0 placeholder:text-slate-400 flex-1"
          placeholder="0"
        />
        {suffix && (
          <span className="px-3 text-xs text-slate-400 bg-slate-50 border-l border-slate-200 h-full flex items-center whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />{error}
        </p>
      )}
    </div>
  )
}

// ─── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string
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

// ─── Format price for display ────────────────────────────────────────────────
function fmt(val?: number) {
  if (!val || val === 0) return <span className="text-slate-300 text-xs">—</span>
  return <span className="font-semibold text-slate-800">₹{val.toLocaleString("en-IN")}</span>
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function VehiclePricePage() {
  const [agents,       setAgents]       = useState<Agent[]>([])
  const [vehicles,     setVehicles]     = useState<Vehicle[]>([])
  const [tripTypes,    setTripTypes]    = useState<tripType[]>([])
  const [prices,       setPrices]       = useState<PriceDetailsByTrip[]>([])
  const [filtered,     setFiltered]     = useState<PriceDetailsByTrip[]>([])

  const [selectedAgent, setSelectedAgent] = useState("")
  const [search,        setSearch]        = useState("")
  const [tripFilter,    setTripFilter]    = useState("all")

  const [loadingInit,   setLoadingInit]   = useState(true)
  const [loadingPrices, setLoadingPrices] = useState(false)

  // Dialog
  const [dialog,       setDialog]        = useState<"add" | "edit" | "delete" | null>(null)
  const [editingPrice, setEditingPrice]  = useState<PriceDetailsByTrip | null>(null)
  const [submitting,   setSubmitting]    = useState(false)

  // Form
  const [form,   setForm]   = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  // Derived
  const activeTripType = tripTypes.find(tt => tt.id === form.tripTypeId)?.name ?? ""
  const selectedAgentObj = agents.find(a => a.id === selectedAgent)

  // ── Load agents + trip types on mount ──────────────────────────────
  useEffect(() => {
    Promise.all([getAgents(), gettripTypes()])
      .then(([a, tt]) => { setAgents(a || []); setTripTypes(tt || []) })
      .catch(() => toast.error("Failed to load initial data."))
      .finally(() => setLoadingInit(false))
  }, [])

  // ── Load prices + vehicles when agent changes ───────────────────────
  const loadPrices = useCallback(async (agentId: string) => {
    if (!agentId) { setPrices([]); setFiltered([]); return }
    setLoadingPrices(true)
    try {
      const [all, veh] = await Promise.all([getAllPrices(), getVehiclesByAgent(agentId)])
      const agentPrices = all.filter(p => p.agentId === agentId)
      setPrices(agentPrices)
      setFiltered(agentPrices)
      setVehicles(veh || [])
    } catch {
      toast.error("Failed to fetch prices.")
    } finally {
      setLoadingPrices(false)
    }
  }, [])

  useEffect(() => { loadPrices(selectedAgent) }, [selectedAgent, loadPrices])

  // ── Filter: search + trip type ──────────────────────────────────────
  useEffect(() => {
    let result = prices
    if (tripFilter !== "all") result = result.filter(p => p.tripTypeName === tripFilter)
    const q = search.toLowerCase().trim()
    if (q) result = result.filter(p =>
      p.vehicleName?.toLowerCase().includes(q) ||
      p.agentVehicleName?.toLowerCase().includes(q) ||
      p.tripTypeName?.toLowerCase().includes(q)
    )
    setFiltered(result)
  }, [prices, search, tripFilter])

  // ── Form helpers ────────────────────────────────────────────────────
  const setField = (name: keyof FormState, val: string) => {
    setForm(f => ({ ...f, [name]: val }))
    setErrors(e => ({ ...e, [name]: "" }))
  }

  const closeDialog = () => {
    setDialog(null)
    setEditingPrice(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditingPrice(null)
    setDialog("add")
  }

  const openEdit = (price: PriceDetailsByTrip) => {
    setEditingPrice(price)
    setForm({
      agentVehicleId:  price.agentVehicleId,
      tripTypeId:      price.tripTypeId,
      localPerKmPrice: price.localPerKmPrice?.toString() || "",
      localMinKm:      price.localMinKm?.toString()      || "",
      airportPrice:    price.airportPrice?.toString()    || "",
      outPerKmPrice:   price.outPerKmPrice?.toString()   || "",
      outMinKm:        price.outMinKm?.toString()        || "",
    })
    setErrors({})
    setDialog("edit")
  }

  const openDelete = (price: PriceDetailsByTrip) => {
    setEditingPrice(price)
    setDialog("delete")
  }

  // ── Save (add or edit) ──────────────────────────────────────────────
  const handleSave = async () => {
    const schema = buildSchema(activeTripType)
    const parsed = schema.safeParse({
      ...form,
      localPerKmPrice: Number(form.localPerKmPrice) || 0,
      localMinKm:      Number(form.localMinKm)      || 0,
      airportPrice:    Number(form.airportPrice)    || 0,
      outPerKmPrice:   Number(form.outPerKmPrice)   || 0,
      outMinKm:        Number(form.outMinKm)        || 0,
    })

    if (!parsed.success) {
      const fieldErrors: typeof errors = {}
      parsed.error.issues.forEach(issue => {
        const key = issue.path[0] as keyof FormState
        fieldErrors[key] = issue.message
        toast.error(issue.message)
      })
      setErrors(fieldErrors)
      return
    }

    const payload: CreatePriceDetailsByTrip = {
      agentVehicleId:  parsed.data.agentVehicleId,
      tripTypeId:      parsed.data.tripTypeId,
      localPerKmPrice: parsed.data.localPerKmPrice || undefined,
      localMinKm:      parsed.data.localMinKm      || undefined,
      airportPrice:    parsed.data.airportPrice    || undefined,
      outPerKmPrice:   parsed.data.outPerKmPrice   || undefined,
      outMinKm:        parsed.data.outMinKm        || undefined,
    }

    setSubmitting(true)
    try {
      if (!editingPrice) {
        // Duplicate check
        const dup = prices.find(
          p => p.agentVehicleId === payload.agentVehicleId && p.tripTypeId === payload.tripTypeId
        )
        if (dup) {
          toast.error("A price already exists for this vehicle and trip type. Edit the existing one instead.")
          setSubmitting(false)
          return
        }
        await addPrice(payload)
        toast.success("Price added successfully.")
      } else {
        await updatePrice(editingPrice.id, payload)
        toast.success("Price updated successfully.")
      }
      await loadPrices(selectedAgent)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save price.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!editingPrice) return
    setSubmitting(true)
    try {
      await deletePrice(editingPrice.id)
      await loadPrices(selectedAgent)
      toast.success("Price deleted.")
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete price.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────
  const localCount     = prices.filter(p => p.tripTypeName === "Local").length
  const airportCount   = prices.filter(p => p.tripTypeName === "Airport").length
  const outstationCount = prices.filter(p => p.tripTypeName === "Out Station").length

  // ── Table columns ───────────────────────────────────────────────────
  const columns: ColumnDef<PriceDetailsByTrip>[] = [
    {
      accessorKey: "vehicleName",
      header: "Vehicle",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <IconCar className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">
              {row.original.agentVehicleName || row.original.vehicleName}
            </div>
            <div className="text-xs text-slate-400">{row.original.seatingCapacity} seats</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tripTypeName",
      header: "Trip Type",
      cell: ({ row }) => {
        const name = row.original.tripTypeName
        const Icon = TRIP_ICONS[name] ?? IconRoute
        const color = TRIP_COLORS[name] ?? "bg-slate-50 text-slate-600 border-slate-200"
        return (
          <Badge className={`${color} border gap-1 font-semibold text-xs`}>
            <Icon className="w-3 h-3" />
            {name}
          </Badge>
        )
      },
    },
    {
      id: "pricing",
      header: "Price Details",
      cell: ({ row }) => {
        const p = row.original
        const name = p.tripTypeName
        if (name === "Local") return (
          <div className="text-xs text-slate-600 space-y-0.5">
            <div><span className="text-slate-400">Per km:</span> {fmt(p.localPerKmPrice)}</div>
            <div><span className="text-slate-400">Min km:</span> <span className="font-semibold text-slate-800">{p.localMinKm ?? "—"}</span></div>
          </div>
        )
        if (name === "Airport") return (
          <div className="text-xs text-slate-600">
            <div><span className="text-slate-400">Fixed:</span> {fmt(p.airportPrice)}</div>
          </div>
        )
        if (name === "Out Station") return (
          <div className="text-xs text-slate-600 space-y-0.5">
            <div><span className="text-slate-400">Per km:</span> {fmt(p.outPerKmPrice)}</div>
            <div><span className="text-slate-400">Min km:</span> <span className="font-semibold text-slate-800">{p.outMinKm ?? "—"}</span></div>
          </div>
        )
        return <span className="text-slate-300 text-xs">—</span>
      },
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

  if (loadingInit) return <PageLoader />

  const inp = "border-0 bg-transparent px-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 text-slate-800 w-full"

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
                <h1 className="text-2xl font-black text-slate-900">Vehicle Prices</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manage per-trip pricing for each agent's vehicles
                </p>
              </div>
              <Button
                onClick={openAdd}
                disabled={!selectedAgent}
                title={!selectedAgent ? "Select an agent first" : "Add price"}
                className="bg-green-600 hover:bg-green-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-green-500/20 flex items-center gap-2 h-10 px-5 self-start sm:self-auto"
              >
                <IconPlus className="w-4 h-4" /> Add Price
              </Button>
            </div>

            {/* ── Agent selector card ─────────────────────────────── */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 shadow-sm">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Select Agent</Label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all min-w-[260px]">
                  <IconUsers className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <Select value={selectedAgent} onValueChange={(v) => { setSelectedAgent(v); setSearch(""); setTripFilter("all") }}>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm focus:ring-0 shadow-none flex-1">
                      <SelectValue placeholder="Choose an agent to view their prices" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAgent && (
                  <Button
                    variant="outline"
                    onClick={() => loadPrices(selectedAgent)}
                    className="h-11 px-4 border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-2"
                  >
                    <IconRefresh className="w-4 h-4" /> Refresh
                  </Button>
                )}

                {selectedAgentObj && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 ml-auto">
                    <IconUsers className="w-4 h-4 text-green-500" />
                    <span>Viewing prices for</span>
                    <span className="font-bold text-slate-800">{selectedAgentObj.name}</span>
                    <IconChevronRight className="w-3.5 h-3.5" />
                    <span className="font-bold text-green-700">{prices.length} price entries</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── No agent selected ───────────────────────────────── */}
            {!selectedAgent && (
              <div className="bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center py-20 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <IconCoinBitcoin className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-700 font-bold text-lg mb-1">Select an Agent</h3>
                <p className="text-slate-400 text-sm max-w-xs">
                  Choose an agent from the dropdown above to view and manage their vehicle pricing.
                </p>
              </div>
            )}

            {/* ── Stats + Table ───────────────────────────────────── */}
            {selectedAgent && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  <StatCard label="Total Prices"    value={prices.length}     icon={IconCoinBitcoin} color="bg-slate-700" />
                  <StatCard label="Local"           value={localCount}        icon={IconMapPin}      color="bg-green-600" />
                  <StatCard label="Airport"         value={airportCount}      icon={IconPlane}       color="bg-blue-600"  />
                  <StatCard label="Outstation"      value={outstationCount}   icon={IconRoute}       color="bg-purple-600"/>
                </div>

                {/* Vehicles without prices warning */}
                {vehicles.length > 0 && prices.length < vehicles.length * tripTypes.length && (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                    <IconAlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      Some vehicles may be missing prices for certain trip types. Vehicles without prices won't appear in user search results.
                    </p>
                  </div>
                )}

                {/* Search + trip filter */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="flex-1 min-w-[220px] flex items-center bg-white border border-slate-200 rounded-xl px-3 h-10 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all">
                    <IconSearch className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search by vehicle or trip type..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-800"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 ml-2 text-sm">✕</button>
                    )}
                  </div>

                  {/* Trip type pill filters */}
                  <div className="flex items-center gap-2">
                    {["all", ...tripTypes.map(t => t.name)].map(t => (
                      <button
                        key={t}
                        onClick={() => setTripFilter(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                          ${tripFilter === t
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                      >
                        {t === "all" ? "All Types" : t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {loadingPrices ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <IconRefresh className="w-7 h-7 animate-spin" />
                        <span className="text-sm">Loading prices...</span>
                      </div>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <IconCoinBitcoin className="w-7 h-7 text-slate-400" />
                      </div>
                      <h3 className="text-slate-700 font-bold mb-1">
                        {search || tripFilter !== "all" ? "No prices match your filters" : "No prices set yet"}
                      </h3>
                      <p className="text-slate-400 text-sm mb-4 max-w-xs">
                        {search || tripFilter !== "all"
                          ? "Try clearing your search or filter."
                          : `${selectedAgentObj?.name} has no prices configured. Add prices so their vehicles appear in search results.`
                        }
                      </p>
                      {!search && tripFilter === "all" && (
                        <Button
                          onClick={openAdd}
                          className="bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold px-5 h-9 text-sm flex items-center gap-2"
                        >
                          <IconPlus className="w-4 h-4" /> Add First Price
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
          ADD / EDIT DIALOG
      ════════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "add" || dialog === "edit"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <div className={`h-1 w-full ${dialog === "edit" ? "bg-gradient-to-r from-blue-500 to-blue-400" : "bg-gradient-to-r from-green-500 to-emerald-400"}`} />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dialog === "edit" ? "bg-blue-100" : "bg-green-100"}`}>
                  {dialog === "edit"
                    ? <IconPencil className="w-4 h-4 text-blue-700" />
                    : <IconPlus className="w-4 h-4 text-green-700" />
                  }
                </div>
                {dialog === "edit" ? "Edit Price" : "Add Price"}
              </DialogTitle>
              {dialog === "edit" && editingPrice && (
                <DialogDescription className="text-slate-500 text-sm">
                  Editing <strong className="text-slate-700">{editingPrice.agentVehicleName}</strong> — {editingPrice.tripTypeName}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="flex flex-col gap-4">
              {/* Vehicle */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-slate-700">Vehicle</Label>
                <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all focus-within:bg-white focus-within:ring-2
                  ${errors.agentVehicleId ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}>
                  <IconCar className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <Select
                    value={form.agentVehicleId}
                    onValueChange={v => setField("agentVehicleId", v)}
                    disabled={dialog === "edit"}
                  >
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm focus:ring-0 shadow-none flex-1">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} ({v.seatingCapacity} seats)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.agentVehicleId && <p className="text-xs text-red-600">{errors.agentVehicleId}</p>}
              </div>

              {/* Trip type */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-slate-700">Trip Type</Label>
                <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all focus-within:bg-white focus-within:ring-2
                  ${errors.tripTypeId ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}
                  ${dialog === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}>
                  <IconRoute className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <Select
                    value={form.tripTypeId}
                    onValueChange={v => setField("tripTypeId", v)}
                    disabled={dialog === "edit"}
                  >
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm focus:ring-0 shadow-none flex-1">
                      <SelectValue placeholder="Select trip type" />
                    </SelectTrigger>
                    <SelectContent>
                      {tripTypes.map(tt => (
                        <SelectItem key={tt.id} value={tt.id}>{tt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {dialog === "edit" && (
                  <p className="text-xs text-slate-400">Trip type cannot be changed when editing.</p>
                )}
                {errors.tripTypeId && <p className="text-xs text-red-600">{errors.tripTypeId}</p>}
              </div>

              {/* Conditional price fields */}
              {activeTripType === "Local" && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <IconMapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-800">Local Trip Pricing</span>
                  </div>
                  <PriceField label="Price per KM" name="localPerKmPrice" value={form.localPerKmPrice}
                    onChange={setField} suffix="per km" error={errors.localPerKmPrice} />
                  <PriceField label="Minimum KM" name="localMinKm" value={form.localMinKm}
                    onChange={setField} prefix="" suffix="km minimum" hint="Minimum distance charged per booking"
                    error={errors.localMinKm} />
                </div>
              )}

              {activeTripType === "Airport" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <IconPlane className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">Airport Trip Pricing</span>
                  </div>
                  <PriceField label="Fixed Airport Price" name="airportPrice" value={form.airportPrice}
                    onChange={setField} hint="One-way fixed fare to/from airport" error={errors.airportPrice} />
                </div>
              )}

              {activeTripType === "Out Station" && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <IconRoute className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-bold text-purple-800">Outstation Trip Pricing</span>
                  </div>
                  <PriceField label="Price per KM" name="outPerKmPrice" value={form.outPerKmPrice}
                    onChange={setField} suffix="per km" error={errors.outPerKmPrice} />
                  <PriceField label="Minimum KM" name="outMinKm" value={form.outMinKm}
                    onChange={setField} prefix="" suffix="km minimum" hint="Minimum distance charged per booking"
                    error={errors.outMinKm} />
                </div>
              )}

              {!activeTripType && form.tripTypeId === "" && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 text-center">
                  Select a trip type to see the pricing fields
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 mt-6">
              <Button variant="outline" onClick={closeDialog} disabled={submitting} className="rounded-xl border-slate-200">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={submitting || !activeTripType}
                className={`rounded-xl font-bold px-6 text-white ${dialog === "edit" ? "bg-blue-600 hover:bg-blue-500" : "bg-green-600 hover:bg-green-500"} disabled:bg-slate-300 disabled:cursor-not-allowed`}
              >
                {submitting ? "Saving..." : dialog === "edit" ? "Save Changes" : "Add Price"}
              </Button>
            </DialogFooter>
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
                Delete Price
              </DialogTitle>
            </DialogHeader>

            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-red-700">
                Delete the <strong>{editingPrice?.tripTypeName}</strong> price for{" "}
                <strong>{editingPrice?.agentVehicleName}</strong>? This vehicle will no longer
                appear in search results for this trip type.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={submitting} className="rounded-xl border-slate-200 flex-1">
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={submitting} className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex-1">
                {submitting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}