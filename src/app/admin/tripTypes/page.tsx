"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
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
  IconRoute,
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconTag,
  IconMapPin,
  IconPlane,
} from "@tabler/icons-react"

import {
  tripType,
  gettripTypes,
  addtripType,
  updatetripType,
  deletetripType,
} from "@/services/admin/tripTypesService"

// ─── Trip type icon map ─────────────────────────────────────────────────────
const TRIP_ICON: Record<string, React.ElementType> = {
  local:       IconMapPin,
  airport:     IconPlane,
  outstation:  IconRoute,
  "out station": IconRoute,
}

const TRIP_COLOR: Record<string, string> = {
  local:         "bg-green-50 text-green-700 border-green-200",
  airport:       "bg-blue-50 text-blue-700 border-blue-200",
  outstation:    "bg-purple-50 text-purple-700 border-purple-200",
  "out station": "bg-purple-50 text-purple-700 border-purple-200",
}

function getTripStyle(name: string) {
  const key = name.toLowerCase()
  return {
    Icon:  TRIP_ICON[key]  ?? IconRoute,
    color: TRIP_COLOR[key] ?? "bg-slate-50 text-slate-600 border-slate-200",
  }
}

// ─── Schema ─────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters")
    .regex(/^[a-zA-Z0-9\s\-\/]+$/, "Only letters, numbers, spaces, hyphens and slashes allowed"),
})
type FormData = z.infer<typeof schema>

const inp = "border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 text-slate-800 w-full"

// ─── Main page ───────────────────────────────────────────────────────────────
export default function TripTypesPage() {
  const [types,      setTypes]      = useState<tripType[]>([])
  const [filtered,   setFiltered]   = useState<tripType[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState("")

  const [dialog,     setDialog]     = useState<"add" | "edit" | "delete" | null>(null)
  const [selected,   setSelected]   = useState<tripType | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchTypes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await gettripTypes()
      setTypes(data || [])
      setFiltered(data || [])
    } catch {
      toast.error("Failed to load trip types.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTypes() }, [fetchTypes])

  // ── Search filter ──────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase().trim()
    setFiltered(q ? types.filter(t => t.name.toLowerCase().includes(q)) : types)
  }, [search, types])

  // ── Helpers ────────────────────────────────────────────────────────
  const openAdd = () => {
    reset({ name: "" })
    setDialog("add")
  }

  const openEdit = (type: tripType) => {
    setSelected(type)
    setValue("name", type.name)
    setDialog("edit")
  }

  const openDelete = (type: tripType) => {
    setSelected(type)
    setDialog("delete")
  }

  const closeDialog = () => {
    setDialog(null)
    setSelected(null)
    reset()
  }

  // ── CRUD ───────────────────────────────────────────────────────────
  const onAdd = async (data: FormData) => {
    if (types.some(t => t.name.toLowerCase() === data.name.toLowerCase().trim())) {
      toast.error(`"${data.name}" already exists. Use a different name.`)
      return
    }
    setSubmitting(true)
    try {
      const created = await addtripType({ name: data.name.trim() })
      setTypes(prev => [...prev, created])
      toast.success(`Trip type "${data.name}" added.`)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to add trip type.")
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async (data: FormData) => {
    if (!selected) return
    if (types.some(t => t.id !== selected.id && t.name.toLowerCase() === data.name.toLowerCase().trim())) {
      toast.error(`"${data.name}" already exists.`)
      return
    }
    setSubmitting(true)
    try {
      const updated = await updatetripType(selected.id, { name: data.name.trim() })
      setTypes(prev => prev.map(t => t.id === selected.id ? updated : t))
      toast.success(`Trip type updated to "${data.name}".`)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update trip type.")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await deletetripType(selected.id)
      setTypes(prev => prev.filter(t => t.id !== selected.id))
      toast.success(`"${selected.name}" deleted.`)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete trip type.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Columns ────────────────────────────────────────────────────────
  const columns: ColumnDef<tripType>[] = [
    {
      accessorKey: "name",
      header: "Trip Type",
      cell: ({ row }) => {
        const { Icon, color } = getTripStyle(row.original.name)
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-slate-600" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">{row.original.name}</span>
          </div>
        )
      },
    },
    {
      id: "badge",
      header: "Label",
      cell: ({ row }) => {
        const { Icon, color } = getTripStyle(row.original.name)
        return (
          <Badge className={`${color} border gap-1 text-xs font-semibold`}>
            <Icon className="w-3 h-3" />
            {row.original.name}
          </Badge>
        )
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

          <div className="flex flex-1 flex-col p-6 bg-slate-50 min-h-full">

            {/* ── Page header ────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Trip Types</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manage the trip categories used in bookings and pricing
                </p>
              </div>
              <Button
                onClick={openAdd}
                className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-md shadow-green-500/20 flex items-center gap-2 h-10 px-5 self-start sm:self-auto"
              >
                <IconPlus className="w-4 h-4" /> Add Trip Type
              </Button>
            </div>

            {/* ── Stats ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                  <IconRoute className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{types.length}</div>
                  <div className="text-xs text-slate-500 font-medium">Total Trip Types</div>
                </div>
              </div>

              {/* Live badge preview of all types */}
              <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap shadow-sm sm:col-span-2">
                {types.length === 0 ? (
                  <span className="text-sm text-slate-400">No trip types added yet</span>
                ) : (
                  types.map(t => {
                    const { Icon, color } = getTripStyle(t.name)
                    return (
                      <Badge key={t.id} className={`${color} border gap-1 font-semibold text-xs`}>
                        <Icon className="w-3 h-3" />
                        {t.name}
                      </Badge>
                    )
                  })
                )}
              </div>
            </div>

            {/* ── Important note ─────────────────────────────────── */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
              <IconRoute className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Important:</strong> Trip types are used in vehicle pricing and booking search.
                The names <strong>Local</strong>, <strong>Airport</strong> and <strong>Out Station</strong> are
                expected by the system — rename or delete them only if you update the pricing logic too.
              </p>
            </div>

            {/* ── Search + refresh ───────────────────────────────── */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 h-10 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all">
                <IconSearch className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search trip types..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-800"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 ml-2 text-sm">✕</button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={fetchTypes}
                className="h-10 px-4 border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-2"
              >
                <IconRefresh className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            {/* ── Table ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <IconRoute className="w-7 h-7 text-slate-400" />
                  </div>
                  <h3 className="text-slate-700 font-bold mb-1">
                    {search ? "No types match your search" : "No trip types yet"}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 max-w-xs">
                    {search
                      ? "Try a different search term."
                      : "Add trip types like Local, Airport and Out Station to enable pricing and bookings."}
                  </p>
                  {!search && (
                    <Button
                      onClick={openAdd}
                      className="bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold px-5 h-9 text-sm flex items-center gap-2"
                    >
                      <IconPlus className="w-4 h-4" /> Add First Type
                    </Button>
                  )}
                </div>
              ) : (
                <DataTable columns={columns} data={filtered} />
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* ══════════════════════════════════════════════════════════
          ADD DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "add"} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <IconPlus className="w-4 h-4 text-green-700" />
                </div>
                Add Trip Type
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                e.g. Local, Airport, Out Station
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onAdd)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-slate-700">Type Name</Label>
                <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all
                  focus-within:bg-white focus-within:ring-2
                  ${errors.name
                    ? "border-red-400 focus-within:ring-red-100"
                    : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}
                >
                  <IconTag className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <Input
                    placeholder="e.g. Local"
                    autoFocus
                    {...register("name")}
                    className={inp}
                  />
                </div>
                <AnimatePresence mode="wait">
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs text-red-600 flex items-center gap-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                      {errors.name.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <DialogFooter className="gap-2 mt-2">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting} className="rounded-xl border-slate-200">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold px-6">
                  {submitting ? "Adding..." : "Add Type"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          EDIT DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "edit"} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <IconPencil className="w-4 h-4 text-blue-700" />
                </div>
                Edit Trip Type
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Editing <strong className="text-slate-700">{selected?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onEdit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold text-slate-700">Type Name</Label>
                <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all
                  focus-within:bg-white focus-within:ring-2
                  ${errors.name
                    ? "border-red-400 focus-within:ring-red-100"
                    : "border-slate-200 focus-within:border-blue-400 focus-within:ring-blue-100"}`}
                >
                  <IconTag className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <Input autoFocus {...register("name")} className={inp} />
                </div>
                <AnimatePresence mode="wait">
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs text-red-600 flex items-center gap-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                      {errors.name.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Warn if renaming a system-critical type */}
              {selected && ["local", "airport", "out station"].includes(selected.name.toLowerCase()) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <IconRoute className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Renaming <strong>{selected.name}</strong> will break pricing and booking search for this trip type. Ensure you update the pricing logic too.
                  </p>
                </div>
              )}

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

      {/* ══════════════════════════════════════════════════════════
          DELETE DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "delete"} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-500 to-red-400" />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <IconTrash className="w-4 h-4 text-red-600" />
                </div>
                Delete Trip Type
              </DialogTitle>
            </DialogHeader>

            {/* Extra warning for system-critical types */}
            {selected && ["local", "airport", "out station"].includes(selected.name.toLowerCase()) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                <IconRoute className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>{selected?.name}</strong> is a system-critical type used in vehicle pricing.
                  Deleting it will break pricing and booking search for this trip type.
                </p>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-red-700">
                Permanently delete <strong>{selected?.name}</strong>? All vehicle prices configured
                for this trip type will become unreachable.
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