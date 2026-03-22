"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getCookie } from "cookies-next"
import {
  Plus, Pencil, Trash2, X, ChevronRight, Car, AlertCircle,
  CheckCircle2, IndianRupee, Gauge, Plane, MapPin, Info,
  Loader2, RotateCcw, Shield,
} from "lucide-react"

import { Button }  from "@/components/ui/button"
import { Input }   from "@/components/ui/input"
import { Label }   from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  getAllPrices, addPrice, updatePrice, deletePrice,
  PriceDetailsByTrip, CreatePriceDTO,
} from "@/services/prices/pricesService"
import { getVehiclesByAgent, Vehicle } from "@/services/admin/agentVehiclesService"
import { gettripTypes, tripType } from "@/services/admin/tripTypesService"

// ── Helpers ────────────────────────────────────────────────────────────────
const TRIP_ICONS: Record<string, React.FC<any>> = {
  local:      Gauge,
  airport:    Plane,
  outstation: MapPin,
  "out station": MapPin,
}

function getTripIcon(name: string) {
  const key = name?.toLowerCase() ?? ""
  for (const [k, Icon] of Object.entries(TRIP_ICONS)) {
    if (key.includes(k)) return Icon
  }
  return Car
}

function getTripColor(name: string): string {
  const key = name?.toLowerCase() ?? ""
  if (key.includes("airport"))  return "blue"
  if (key.includes("out"))      return "purple"
  return "green"
}

const COLOR_MAP = {
  green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  icon: "bg-green-100",  badge: "bg-green-600"  },
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   icon: "bg-blue-100",   badge: "bg-blue-600"   },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "bg-purple-100", badge: "bg-purple-600" },
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ onAdd, hasVehicles }: { onAdd: () => void; hasVehicles: boolean }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-5">
        <IndianRupee className="w-10 h-10 text-green-400"/>
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-2">No prices set yet</h3>
      {hasVehicles ? (
        <>
          <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
            Add pricing for each vehicle and trip type so customers can find and book your cabs.
          </p>
          <Button onClick={onAdd} className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2"/> Add First Price
          </Button>
        </>
      ) : (
        <p className="text-slate-500 text-sm max-w-xs">
          You need to add vehicles first before setting prices.
        </p>
      )}
    </motion.div>
  )
}

// ── Price card ─────────────────────────────────────────────────────────────
interface PriceCardProps {
  price:    PriceDetailsByTrip
  onEdit:   (p: PriceDetailsByTrip) => void
  onDelete: (id: string) => void
  deleting: string | null
}

function PriceCard({ price, onEdit, onDelete, deleting }: PriceCardProps) {
  const color   = getTripColor(price.tripTypeName)
  const cls     = COLOR_MAP[color as keyof typeof COLOR_MAP]
  const Icon    = getTripIcon(price.tripTypeName)
  const isLocal    = price.tripTypeName?.toLowerCase().includes("local")
  const isAirport  = price.tripTypeName?.toLowerCase().includes("airport")
  const isOut      = price.tripTypeName?.toLowerCase().includes("out")
  const isDeleting = deleting === price.id

  return (
    <motion.div layout initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.96 }}
      className={`bg-white rounded-2xl border ${cls.border} overflow-hidden hover:shadow-md transition-all duration-200`}>

      {/* Header */}
      <div className={`${cls.bg} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${cls.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${cls.text}`}/>
          </div>
          <div>
            <div className="font-black text-slate-900 text-sm">{price.vehicleName}</div>
            <div className="text-xs text-slate-500 mt-0.5">{price.seatingCapacity} seats</div>
          </div>
        </div>
        <span className={`${cls.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
          {price.tripTypeName}
        </span>
      </div>

      {/* Price rows */}
      <div className="px-5 py-4 space-y-2">
        {isLocal && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5"/> Per km
              </span>
              <span className="font-black text-slate-900 text-base">₹{price.localPerKmPrice ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5"/> Minimum km
              </span>
              <span className="font-bold text-slate-700">{price.localMinKm ?? "—"} km</span>
            </div>
          </>
        )}
        {isAirport && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5"/> Fixed fare
            </span>
            <span className="font-black text-slate-900 text-base">₹{price.airportPrice ?? "—"}</span>
          </div>
        )}
        {isOut && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5"/> Per km
              </span>
              <span className="font-black text-slate-900 text-base">₹{price.outPerKmPrice ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5"/> Minimum km
              </span>
              <span className="font-bold text-slate-700">{price.outMinKm ?? "—"} km</span>
            </div>
            {price.driverDayAllowance && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Driver bata/day</span>
                <span className="font-bold text-slate-700">₹{price.driverDayAllowance}</span>
              </div>
            )}
            {price.driverNightAllowance && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Night allowance</span>
                <span className="font-bold text-slate-700">₹{price.driverNightAllowance}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Tolls</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${price.tollIncluded ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                {price.tollIncluded ? "Included" : "Extra"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(price)}
          className="flex-1 h-9 rounded-xl border-slate-200 text-slate-700 font-semibold hover:border-green-300 hover:text-green-700">
          <Pencil className="w-3.5 h-3.5 mr-1.5"/> Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(price.id)}
          disabled={isDeleting}
          className="flex-1 h-9 rounded-xl border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50">
          {isDeleting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin"/>
            : <><Trash2 className="w-3.5 h-3.5 mr-1.5"/> Delete</>
          }
        </Button>
      </div>
    </motion.div>
  )
}

// ── Number input ───────────────────────────────────────────────────────────
function NumInput({ label, name, value, onChange, prefix = "₹", suffix, error }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string; suffix?: string; error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600">{label}</Label>
      <div className={`flex items-center bg-slate-50 border rounded-xl overflow-hidden transition-all focus-within:bg-white focus-within:ring-2 ${error ? "border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}>
        {prefix && <span className="px-3 text-sm font-semibold text-slate-500 border-r border-slate-200 h-11 flex items-center bg-slate-100">{prefix}</span>}
        <Input name={name} type="number" min="0" value={value} onChange={onChange}
          className="border-0 bg-transparent h-11 text-sm focus-visible:ring-0 font-semibold"/>
        {suffix && <span className="px-3 text-sm text-slate-400">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
    </div>
  )
}

// ── Add/Edit drawer ────────────────────────────────────────────────────────
interface DrawerProps {
  open:       boolean
  onClose:    () => void
  onSave:     (data: CreatePriceDTO) => Promise<void>
  vehicles:   Vehicle[]
  tripTypes:  tripType[]
  editing:    PriceDetailsByTrip | null
  existingIds: string[] // "vehicleId_tripTypeId" combos already set
}

function PriceDrawer({ open, onClose, onSave, vehicles, tripTypes, editing, existingIds }: DrawerProps) {
  const blank = { agentVehicleId:"", tripTypeId:"", localPerKmPrice:"", localMinKm:"",
                  airportPrice:"", outPerKmPrice:"", outMinKm:"",
                  driverDayAllowance:"250", driverNightAllowance:"400", tollIncluded:"false" }

  const [form,   setForm]   = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    if (!open) { setTimeout(() => { setForm(blank); setErrors({}); setSaved(false) }, 300); return }
    if (editing) {
      setForm({
        agentVehicleId:      editing.agentVehicleId,
        tripTypeId:          editing.tripTypeId,
        localPerKmPrice:     editing.localPerKmPrice?.toString()     ?? "",
        localMinKm:          editing.localMinKm?.toString()          ?? "",
        airportPrice:        editing.airportPrice?.toString()         ?? "",
        outPerKmPrice:       editing.outPerKmPrice?.toString()        ?? "",
        outMinKm:            editing.outMinKm?.toString()             ?? "",
        driverDayAllowance:  editing.driverDayAllowance?.toString()   ?? "250",
        driverNightAllowance:editing.driverNightAllowance?.toString() ?? "400",
        tollIncluded:        editing.tollIncluded ? "true" : "false",
      })
    } else {
      setForm(blank)
    }
    setErrors({})
    setSaved(false)
  }, [open, editing])

  const set = (k: string, v: string) => { setForm(p => ({...p, [k]: v})); setErrors(p => ({...p, [k]: ""})) }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.name, e.target.value)

  const tripName = tripTypes.find(t => t.id === form.tripTypeId)?.name ?? ""
  const isLocal   = tripName.toLowerCase().includes("local")
  const isAirport = tripName.toLowerCase().includes("airport")
  const isOut     = tripName.toLowerCase().includes("out")

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.agentVehicleId) e.agentVehicleId = "Select a vehicle"
    if (!form.tripTypeId)     e.tripTypeId     = "Select a trip type"
    // Duplicate check
    if (!editing) {
      const key = `${form.agentVehicleId}_${form.tripTypeId}`
      if (existingIds.includes(key)) e.tripTypeId = "Price already exists for this vehicle + trip type"
    }
    if (isLocal) {
      if (!form.localPerKmPrice || Number(form.localPerKmPrice) <= 0) e.localPerKmPrice = "Enter price per km"
      if (!form.localMinKm      || Number(form.localMinKm) <= 0)      e.localMinKm      = "Enter minimum km"
    }
    if (isAirport) {
      if (!form.airportPrice || Number(form.airportPrice) <= 0) e.airportPrice = "Enter airport fixed price"
    }
    if (isOut) {
      if (!form.outPerKmPrice || Number(form.outPerKmPrice) <= 0) e.outPerKmPrice = "Enter price per km"
      if (!form.outMinKm      || Number(form.outMinKm) <= 0)      e.outMinKm      = "Enter minimum km"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload: CreatePriceDTO = {
        agentVehicleId:      form.agentVehicleId,
        tripTypeId:          form.tripTypeId,
        localPerKmPrice:     isLocal   ? Number(form.localPerKmPrice) : undefined,
        localMinKm:          isLocal   ? Number(form.localMinKm)      : undefined,
        airportPrice:        isAirport ? Number(form.airportPrice)    : undefined,
        outPerKmPrice:       isOut     ? Number(form.outPerKmPrice)   : undefined,
        outMinKm:            isOut     ? Number(form.outMinKm)        : undefined,
        driverDayAllowance:  isOut     ? Number(form.driverDayAllowance)   : undefined,
        driverNightAllowance:isOut     ? Number(form.driverNightAllowance) : undefined,
        tollIncluded:        isOut     ? form.tollIncluded === "true" : undefined,
      }
      await onSave(payload)
      setSaved(true)
      setTimeout(onClose, 1200)
    } catch {
      setErrors({ submit: "Failed to save. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={onClose}>
          <motion.div
            initial={{ y:60, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:60, opacity:0 }}
            transition={{ type:"spring", stiffness:320, damping:32 }}
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full"/>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editing ? "Edit Price" : "Add Price"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editing ? "Update pricing details" : "Set pricing for a vehicle and trip type"}
                </p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-600"/>
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Vehicle select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Vehicle *</Label>
                <div className={`border rounded-xl overflow-hidden transition-all ${errors.agentVehicleId ? "border-red-400" : "border-slate-200"}`}>
                  <Select value={form.agentVehicleId} onValueChange={v => set("agentVehicleId", v)}
                    disabled={!!editing}>
                    <SelectTrigger className="h-11 border-0 bg-slate-50 focus:ring-0 text-sm font-medium">
                      <SelectValue placeholder="Select your vehicle"/>
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length === 0
                        ? <div className="px-3 py-4 text-sm text-slate-400 text-center">No vehicles added yet</div>
                        : vehicles.map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} <span className="text-slate-400">· {v.seatingCapacity} seats</span>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                {errors.agentVehicleId && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.agentVehicleId}</p>}
              </div>

              {/* Trip type select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Trip Type *</Label>
                <div className={`border rounded-xl overflow-hidden transition-all ${errors.tripTypeId ? "border-red-400" : "border-slate-200"}`}>
                  <Select value={form.tripTypeId} onValueChange={v => set("tripTypeId", v)}
                    disabled={!!editing}>
                    <SelectTrigger className="h-11 border-0 bg-slate-50 focus:ring-0 text-sm font-medium">
                      <SelectValue placeholder="Select trip type"/>
                    </SelectTrigger>
                    <SelectContent>
                      {tripTypes.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.tripTypeId && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.tripTypeId}</p>}
              </div>

              {/* Conditional pricing fields */}
              <AnimatePresence mode="wait">
                {isLocal && (
                  <motion.div key="local" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    className="space-y-4 bg-green-50 border border-green-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Gauge className="w-4 h-4 text-green-600"/>
                      <span className="text-sm font-bold text-green-800">Local Trip Pricing</span>
                    </div>
                    <NumInput label="Price per km *" name="localPerKmPrice" value={form.localPerKmPrice}
                      onChange={handleChange} error={errors.localPerKmPrice}/>
                    <NumInput label="Minimum km per booking *" name="localMinKm" value={form.localMinKm}
                      onChange={handleChange} prefix="km" suffix="km" error={errors.localMinKm}/>
                    <p className="text-xs text-green-700 bg-green-100 rounded-lg px-3 py-2">
                      Fare = max(actual km, min km) × ₹{form.localPerKmPrice || "—"}/km
                    </p>
                  </motion.div>
                )}

                {isAirport && (
                  <motion.div key="airport" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    className="space-y-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Plane className="w-4 h-4 text-blue-600"/>
                      <span className="text-sm font-bold text-blue-800">Airport Trip Pricing</span>
                    </div>
                    <NumInput label="Fixed airport fare *" name="airportPrice" value={form.airportPrice}
                      onChange={handleChange} error={errors.airportPrice}/>
                    <p className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
                      One-way fixed fare to/from Hubli Airport (HBX)
                    </p>
                  </motion.div>
                )}

                {isOut && (
                  <motion.div key="outstation" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    className="space-y-4 bg-purple-50 border border-purple-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-purple-600"/>
                      <span className="text-sm font-bold text-purple-800">Outstation Pricing</span>
                    </div>
                    <NumInput label="Price per km *" name="outPerKmPrice" value={form.outPerKmPrice}
                      onChange={handleChange} error={errors.outPerKmPrice}/>
                    <NumInput label="Minimum km per booking *" name="outMinKm" value={form.outMinKm}
                      onChange={handleChange} prefix="km" suffix="km" error={errors.outMinKm}/>

                    <div className="border-t border-purple-200 pt-4 space-y-3">
                      <p className="text-xs font-semibold text-purple-800">Driver Allowances</p>
                      <NumInput label="Driver bata per day" name="driverDayAllowance"
                        value={form.driverDayAllowance} onChange={handleChange}/>
                      <NumInput label="Night halt allowance" name="driverNightAllowance"
                        value={form.driverNightAllowance} onChange={handleChange}/>
                      {/* Toll toggle */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Toll charges</Label>
                        <div className="flex gap-2">
                          {[{val:"false",label:"Customer pays tolls"},{val:"true",label:"Tolls included in fare"}].map(opt => (
                            <button key={opt.val} type="button"
                              onClick={() => set("tollIncluded", opt.val)}
                              className={`flex-1 h-9 rounded-xl text-xs font-semibold border transition-all ${
                                form.tollIncluded === opt.val
                                  ? "bg-purple-600 text-white border-purple-600"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                              }`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-purple-700 bg-purple-100 rounded-lg px-3 py-2">
                      Fare = max(km, {form.outMinKm||"min"}) × ₹{form.outPerKmPrice||"—"}/km + driver allowances
                    </p>
                  </motion.div>
                )}

                {!isLocal && !isAirport && !isOut && form.tripTypeId && (
                  <motion.div key="unknown" initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0"/>
                    <p className="text-xs text-amber-700">Select a trip type to see pricing fields</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0"/>
                  <p className="text-xs text-red-700">{errors.submit}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
              {saved ? (
                <div className="h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600"/>
                  <span className="text-green-700 font-bold text-sm">Saved successfully!</span>
                </div>
              ) : (
                <Button onClick={handleSave} disabled={saving}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/25 disabled:opacity-50">
                  {saving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Saving…</>
                    : editing ? "Update Price" : "Add Price"
                  }
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Delete confirmation ────────────────────────────────────────────────────
function DeleteConfirm({ id, onConfirm, onCancel }: {
  id: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500"/>
        </div>
        <h3 className="font-black text-slate-900 text-center mb-2">Delete Price?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          This price entry will be removed. Customers won't see this cab for the selected trip type.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 h-10 rounded-xl">Cancel</Button>
          <Button onClick={onConfirm} className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold">
            Delete
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AgentVehiclePricePage() {
  const agentId = (getCookie("agentId") as string) || (getCookie("loginId") as string) || ""

  const [vehicles,  setVehicles]  = useState<Vehicle[]>([])
  const [tripTypes, setTripTypes] = useState<tripType[]>([])
  const [prices,    setPrices]    = useState<PriceDetailsByTrip[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState("")

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing,    setEditing]    = useState<PriceDetailsByTrip | null>(null)
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)

  // Group prices by vehicle for display
  const [filterVehicle, setFilterVehicle] = useState("all")

  const load = useCallback(async () => {
    if (!agentId) return
    setLoading(true); setError("")
    try {
      const [tts, vehs, allPrices] = await Promise.all([
        gettripTypes(),
        getVehiclesByAgent(agentId),
        getAllPrices(),
      ])
      setTripTypes(tts)
      setVehicles(vehs)
      setPrices(allPrices.filter(p => p.agentId === agentId))
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => { load() }, [load])

  const existingComboIds = prices.map(p => `${p.agentVehicleId}_${p.tripTypeId}`)

  const handleSave = async (data: CreatePriceDTO) => {
    if (editing) {
      await updatePrice(editing.id, data)
    } else {
      await addPrice(data)
    }
    await load()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(deleteId); setDeleteId(null)
    try {
      await deletePrice(deleteId)
      await load()
    } catch {
      setError("Failed to delete price")
    } finally {
      setDeleting(null)
    }
  }

  const openAdd = () => { setEditing(null); setDrawerOpen(true) }
  const openEdit = (p: PriceDetailsByTrip) => { setEditing(p); setDrawerOpen(true) }

  // Filter
  const filtered = filterVehicle === "all"
    ? prices
    : prices.filter(p => p.agentVehicleId === filterVehicle)

  // Stats
  const totalVehiclesWithPrices = new Set(prices.map(p => p.agentVehicleId)).size
  const vehiclesWithoutPrices   = vehicles.filter(v => !prices.some(p => p.agentVehicleId === v.id))

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Vehicle Prices</h1>
            <p className="text-sm text-slate-500 mt-0.5">Set pricing for each vehicle and trip type</p>
          </div>
          <Button onClick={openAdd} disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/25">
            <Plus className="w-4 h-4 mr-2"/> Add Price
          </Button>
        </div>

        {/* Stats row */}
        {!loading && prices.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label:"Total Prices",     value: prices.length,              color:"bg-green-600" },
              { label:"Vehicles Listed",  value: totalVehiclesWithPrices,    color:"bg-blue-600"  },
              { label:"Not Listed",       value: vehiclesWithoutPrices.length, color:"bg-amber-500" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <div className={`text-2xl font-black ${s.value > 0 && s.label === "Not Listed" ? "text-amber-600" : "text-slate-900"}`}>
                  {s.value}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Unlisted vehicles warning */}
        {!loading && vehiclesWithoutPrices.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
            <div>
              <div className="font-bold text-amber-900 text-sm">Some vehicles need pricing</div>
              <div className="text-xs text-amber-700 mt-1">
                {vehiclesWithoutPrices.map(v => v.name).join(", ")} — add prices so they appear in search results.
              </div>
              <button onClick={openAdd} className="text-xs font-bold text-amber-800 underline mt-1">
                Add prices now →
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0"/>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={load} className="text-xs font-bold text-red-600 underline flex items-center gap-1">
              <RotateCcw className="w-3 h-3"/> Retry
            </button>
          </div>
        )}

        {/* Vehicle filter tabs */}
        {!loading && prices.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            <button onClick={() => setFilterVehicle("all")}
              className={`flex-shrink-0 h-8 px-3 rounded-xl text-xs font-semibold transition-all ${
                filterVehicle === "all" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}>
              All ({prices.length})
            </button>
            {vehicles.filter(v => prices.some(p => p.agentVehicleId === v.id)).map(v => (
              <button key={v.id} onClick={() => setFilterVehicle(v.id)}
                className={`flex-shrink-0 h-8 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  filterVehicle === v.id ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-green-300"
                }`}>
                {v.name} ({prices.filter(p => p.agentVehicleId === v.id).length})
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-16 bg-slate-100"/>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4"/>
                  <div className="h-4 bg-slate-100 rounded w-1/2"/>
                  <div className="h-9 bg-slate-100 rounded-xl"/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && prices.length === 0 && (
          <EmptyState onAdd={openAdd} hasVehicles={vehicles.length > 0}/>
        )}

        {/* Price cards grid */}
        {!loading && filtered.length > 0 && (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <PriceCard key={p.id} price={p}
                  onEdit={openEdit}
                  onDelete={id => setDeleteId(id)}
                  deleting={deleting}/>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Info footer */}
        {!loading && prices.length > 0 && (
          <div className="mt-8 bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-slate-500 leading-relaxed">
              Prices are shown to customers when they search for cabs. Each vehicle can have one price per trip type.
              You can update prices at any time — changes reflect immediately in search results.
            </p>
          </div>
        )}
      </div>

      {/* Drawer */}
      <PriceDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        onSave={handleSave}
        vehicles={vehicles}
        tripTypes={tripTypes}
        editing={editing}
        existingIds={existingComboIds}
      />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <DeleteConfirm
            id={deleteId}
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
