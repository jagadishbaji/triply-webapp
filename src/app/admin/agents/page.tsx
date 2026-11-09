"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast, Toaster } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { PageLoader } from "@/components/ui/loader"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  IconUsers, IconPlus, IconPencil, IconTrash,
  IconKey, IconSearch, IconRefresh, IconCircleCheckFilled,
  IconCircleXFilled, IconMail, IconPhone, IconMapPin,
  IconLicense, IconEye, IconEyeOff, IconUser,
} from "@tabler/icons-react"

import {
  Agent, getAgents, createAgent, updateAgent, deleteAgent,
} from "@/services/admin/agentsService"
import { forgotPassword } from "@/services/authService"
import type { ColumnDef } from "@tanstack/react-table"

// ─── Schemas ─────────────────────────────────────────────────────────────────
// ALL field names match CreateAgentPayload exactly — no "name" alias
const addSchema = z.object({
  businessName:  z.string().min(2, "Business name must be at least 2 characters"),
  ownerName:     z.string().min(2, "Owner name must be at least 2 characters"),
  email:         z.string().email("Invalid email address"),
  phoneNumber:   z.string().regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile number"),
  address:       z.string().min(3, "Address is required"),
  licenseNumber: z.string().optional(),
  password:      z.string().min(6, "Password must be at least 6 characters"),
  isActive:      z.boolean(),
})

const editSchema = z.object({
  businessName:  z.string().min(2, "Business name must be at least 2 characters"),
  ownerName:     z.string().min(2, "Owner name must be at least 2 characters"),
  phoneNumber:   z.string().regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile number"),
  address:       z.string().min(3, "Address is required"),
  licenseNumber: z.string().optional(),
  isActive:      z.boolean(),
})

type AddForm  = z.infer<typeof addSchema>
type EditForm = z.infer<typeof editSchema>

// ─── Reusable field wrapper ───────────────────────────────────────────────────
function Field({ label, icon: Icon, error, children }: {
  label: string; icon?: React.ElementType; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all
        focus-within:bg-white focus-within:ring-2
        ${error
          ? "border-red-400 bg-red-50/30 focus-within:ring-red-100"
          : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"
        }`}>
        {Icon && <Icon className={`w-4 h-4 mr-2 flex-shrink-0 ${error ? "text-red-400" : "text-slate-400"}`}/>}
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 inline-block"/>{error}
        </p>
      )}
    </div>
  )
}

// ─── Stats card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <IconUsers className="w-5 h-5 text-white"/>
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const [agents,     setAgents]     = useState<Agent[]>([])
  const [filtered,   setFiltered]   = useState<Agent[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState("")
  const [dialog,     setDialog]     = useState<"add" | "edit" | "delete" | "reset" | null>(null)
  const [selected,   setSelected]   = useState<Agent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPw,     setShowPw]     = useState(false)

  // ── Forms ───────────────────────────────────────────────────────────────
  const addForm = useForm<AddForm>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      isActive: true,
      businessName: "", ownerName: "", email: "",
      phoneNumber: "", address: "", licenseNumber: "", password: "",
    },
  })

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { isActive: true },
  })

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAgents()
      setAgents(data || [])
      setFiltered(data || [])
    } catch {
      toast.error("Failed to fetch agents. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  // ── Search ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(q
      ? agents.filter(a =>
          (a.businessName ?? a.name ?? "").toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phoneNumber.includes(q) ||
          (a.licenseNumber ?? "").toLowerCase().includes(q)
        )
      : agents
    )
  }, [search, agents])

  // ── Stats ───────────────────────────────────────────────────────────────
  const totalAgents    = agents.length
  const activeAgents   = agents.filter(a => a.isActive).length
  const inactiveAgents = totalAgents - activeAgents

  // ── Dialog helpers ──────────────────────────────────────────────────────
  const openAdd = () => {
    addForm.reset({
      isActive: true,
      businessName: "", ownerName: "", email: "",
      phoneNumber: "", address: "", licenseNumber: "", password: "",
    })
    setShowPw(false)
    setDialog("add")
  }

  const openEdit = (agent: Agent) => {
    setSelected(agent)
    editForm.reset({
      businessName:  agent.businessName || agent.name || "",
      ownerName:     agent.ownerName    || "",
      phoneNumber:   agent.phoneNumber  || "",
      address:       agent.address      || "",
      licenseNumber: agent.licenseNumber || "",
      isActive:      agent.isActive,
    })
    setDialog("edit")
  }

  const openDelete  = (agent: Agent) => { setSelected(agent); setDialog("delete") }
  const openReset   = (agent: Agent) => { setSelected(agent); setDialog("reset")  }
  const closeDialog = () => { setDialog(null); setSelected(null) }

  // ── Add ─────────────────────────────────────────────────────────────────
  const onAdd = async (data: AddForm) => {
    setSubmitting(true)
    try {
      const newAgent = await createAgent({
        email:    data.email,
        password: data.password,
        agentData: {
          businessName:  data.businessName,
          ownerName:     data.ownerName,
          phoneNumber:   data.phoneNumber,
          address:       data.address,
          city:          "Hubli",
          licenseNumber: data.licenseNumber || undefined,
          isActive:      data.isActive,
        },
      })
      setAgents(prev => [...prev, newAgent])
      toast.success(`Agent "${data.businessName}" added successfully.`)
      closeDialog()
    } catch (err: any) {
      let msg = err?.message || "Failed to add agent."
      try {
        const parsed = JSON.parse(msg)
        if (parsed?.message)         msg = parsed.message
        else if (parsed?.code === "23505") msg = "This email is already registered."
        else if (parsed?.code === "23502") msg = "Missing required fields. Please check all inputs."
      } catch { /* plain text error */ }
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────
  const onEdit = async (data: EditForm) => {
    if (!selected) return
    setSubmitting(true)
    try {
      const updated = await updateAgent(selected.id, {
        businessName:  data.businessName,
        ownerName:     data.ownerName,
        phoneNumber:   data.phoneNumber,
        address:       data.address,
        licenseNumber: data.licenseNumber || undefined,
      })
      setAgents(prev => prev.map(a => a.id === selected.id ? updated : a))
      toast.success(`Agent "${data.businessName}" updated successfully.`)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update agent.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  const onDelete = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await deleteAgent(selected.id)
      setAgents(prev => prev.filter(a => a.id !== selected.id))
      toast.success(`Agent "${selected.businessName || selected.name}" deleted.`)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete agent.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Reset password ──────────────────────────────────────────────────────
  const onResetPassword = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await forgotPassword(selected.email)
      toast.success(`Reset link sent to ${selected.email}`)
      closeDialog()
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset link.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Table columns ───────────────────────────────────────────────────────
  const columns: ColumnDef<Agent>[] = [
    {
      accessorKey: "businessName",
      header: "Agent",
      cell: ({ row }) => {
        const name = row.original.businessName || row.original.name || "?"
        const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("")
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{name}</div>
              <div className="text-xs text-slate-500">{row.original.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => <span className="text-sm text-slate-600">{row.original.phoneNumber}</span>,
    },
    {
      accessorKey: "licenseNumber",
      header: "License No.",
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
          {row.original.licenseNumber || "—"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => row.original.isActive
        ? <Badge className="bg-green-50 text-green-700 border border-green-200 gap-1 font-semibold"><IconCircleCheckFilled className="w-3 h-3"/> Active</Badge>
        : <Badge className="bg-red-50 text-red-600 border border-red-200 gap-1 font-semibold"><IconCircleXFilled className="w-3 h-3"/> Inactive</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => {
        const d = new Date(row.original.createdAt)
        return (
          <span className="text-xs text-slate-500">
            {isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => openReset(row.original)}
            className="h-8 px-2.5 text-xs border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg">
            <IconKey className="w-3.5 h-3.5 mr-1"/> Reset Pwd
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}
            className="h-8 px-2.5 text-xs border-slate-200 text-slate-600 hover:text-green-700 hover:border-green-300 rounded-lg">
            <IconPencil className="w-3.5 h-3.5 mr-1"/> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => openDelete(row.original)}
            className="h-8 px-2.5 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg">
            <IconTrash className="w-3.5 h-3.5 mr-1"/> Delete
          </Button>
        </div>
      ),
    },
  ]

  if (loading) return <PageLoader/>

  const inp = "border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-slate-400 text-slate-800 w-full"

  return (
    <>
      <Toaster richColors position="top-right"/>
      <SidebarProvider style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}>
        <AppSidebar variant="inset"/>
        <SidebarInset>
          <SiteHeader/>
          <div className="flex flex-1 flex-col p-6 bg-slate-50 min-h-full">

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Agents</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage all registered tours & travels operators</p>
              </div>
              <Button onClick={openAdd}
                className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-md shadow-green-500/20 flex items-center gap-2 h-10 px-5 self-start sm:self-auto">
                <IconPlus className="w-4 h-4"/> Add Agent
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Agents"    value={totalAgents}    color="bg-slate-700"/>
              <StatCard label="Active Agents"   value={activeAgents}   color="bg-green-600"/>
              <StatCard label="Inactive Agents" value={inactiveAgents} color="bg-red-500"/>
            </div>

            {/* Search + refresh */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 h-10 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all">
                <IconSearch className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0"/>
                <input type="text" placeholder="Search by name, email, phone or license..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-800"/>
                {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 ml-2">✕</button>}
              </div>
              <Button variant="outline" onClick={fetchAgents}
                className="h-10 px-4 border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-2">
                <IconRefresh className="w-4 h-4"/>
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <IconUsers className="w-7 h-7 text-slate-400"/>
                  </div>
                  <p className="text-slate-700 font-semibold mb-1">
                    {search ? "No agents match your search" : "No agents yet"}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {search ? "Try a different search term." : "Click 'Add Agent' to get started."}
                  </p>
                </div>
              ) : (
                <DataTable columns={columns} data={filtered}/>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* ═══════════════════════════════════════
          ADD DIALOG
      ═══════════════════════════════════════ */}
      <Dialog open={dialog === "add"} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400"/>
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <IconPlus className="w-4 h-4 text-green-700"/>
                </div>
                Add New Agent
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Fill in the details below to register a new agent.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={addForm.handleSubmit(onAdd)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">

                {/* Business name — FIXED: register("businessName") not register("name") */}
                <div className="col-span-2">
                  <Field label="Business / Shop Name" icon={IconUsers}
                    error={addForm.formState.errors.businessName?.message}>
                    <Input placeholder="e.g. Sri Basaveshwara Tours and Travels"
                      {...addForm.register("businessName")} className={inp}/>
                  </Field>
                </div>

                {/* Owner name — FIXED: was completely missing */}
                <div className="col-span-2">
                  <Field label="Owner Name" icon={IconUser}
                    error={addForm.formState.errors.ownerName?.message}>
                    <Input placeholder="e.g. Rajesh Kumar"
                      {...addForm.register("ownerName")} className={inp}/>
                  </Field>
                </div>

                <Field label="Email" icon={IconMail}
                  error={addForm.formState.errors.email?.message}>
                  <Input type="email" placeholder="agent@email.com"
                    {...addForm.register("email")} className={inp}/>
                </Field>

                <Field label="Mobile" icon={IconPhone}
                  error={addForm.formState.errors.phoneNumber?.message}>
                  <Input type="tel" maxLength={10} placeholder="10-digit number"
                    {...addForm.register("phoneNumber")} className={inp}/>
                </Field>

                <div className="col-span-2">
                  <Field label="Business Address" icon={IconMapPin}
                    error={addForm.formState.errors.address?.message}>
                    <Input placeholder="Shop No., Street, Area, Hubli"
                      {...addForm.register("address")} className={inp}/>
                  </Field>
                </div>

                <Field label="License / Permit No. (optional)" icon={IconLicense}
                  error={addForm.formState.errors.licenseNumber?.message}>
                  <Input placeholder="KA-29-XXXXXX"
                    {...addForm.register("licenseNumber")} className={inp}/>
                </Field>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">Password</Label>
                  <div className={`flex items-center bg-slate-50 border rounded-xl px-3 h-11 transition-all
                    focus-within:bg-white focus-within:ring-2
                    ${addForm.formState.errors.password
                      ? "border-red-400 focus-within:ring-red-100"
                      : "border-slate-200 focus-within:border-green-500 focus-within:ring-green-100"}`}>
                    <Input type={showPw ? "text" : "password"} placeholder="Min. 6 chars"
                      {...addForm.register("password")} className={inp}/>
                    <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                      className="ml-2 text-slate-400 hover:text-slate-600 flex-shrink-0">
                      {showPw ? <IconEyeOff className="w-4 h-4"/> : <IconEye className="w-4 h-4"/>}
                    </button>
                  </div>
                  {addForm.formState.errors.password && (
                    <p className="text-xs text-red-600 mt-1">{addForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <Controller name="isActive" control={addForm.control}
                  render={({ field }) => (
                    <Checkbox id="add-isActive" checked={field.value}
                      onCheckedChange={v => field.onChange(v === true)} {...addForm.register("isActive")}/>
                  )}/>
                <div>
                  <Label htmlFor="add-isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Activate immediately  
                  </Label>
                  <p className="text-xs text-slate-400">Agent can login and list vehicles right away</p>
                </div>
              </div>

              <DialogFooter className="gap-2 mt-2">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}
                  className="rounded-xl border-slate-200">Cancel</Button>
                <Button type="submit" disabled={submitting}
                  className="bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold px-6">
                  {submitting ? "Adding…" : "Add Agent"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════
          EDIT DIALOG
      ═══════════════════════════════════════ */}
      <Dialog open={dialog === "edit"} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400"/>
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <IconPencil className="w-4 h-4 text-blue-700"/>
                </div>
                Edit Agent
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Editing <strong className="text-slate-700">{selected?.businessName || selected?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={editForm.handleSubmit(onEdit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">

                {/* FIXED: register("businessName") not register("name") */}
                <div className="col-span-2">
                  <Field label="Business / Shop Name" icon={IconUsers}
                    error={editForm.formState.errors.businessName?.message}>
                    <Input {...editForm.register("businessName")} className={inp}/>
                  </Field>
                </div>

                {/* FIXED: ownerName was missing from edit form */}
                <div className="col-span-2">
                  <Field label="Owner Name" icon={IconUser}
                    error={editForm.formState.errors.ownerName?.message}>
                    <Input {...editForm.register("ownerName")} className={inp}/>
                  </Field>
                </div>

                <Field label="Mobile" icon={IconPhone}
                  error={editForm.formState.errors.phoneNumber?.message}>
                  <Input type="tel" maxLength={10} {...editForm.register("phoneNumber")} className={inp}/>
                </Field>

                <Field label="License / Permit No." icon={IconLicense}
                  error={editForm.formState.errors.licenseNumber?.message}>
                  <Input {...editForm.register("licenseNumber")} className={inp}/>
                </Field>

                <div className="col-span-2">
                  <Field label="Address" icon={IconMapPin}
                    error={editForm.formState.errors.address?.message}>
                    <Input {...editForm.register("address")} className={inp}/>
                  </Field>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <Controller name="isActive" control={editForm.control}
                  render={({ field }) => (
                    <Checkbox id="edit-isActive" checked={field.value}
                      onCheckedChange={v => field.onChange(v === true)}/>
                  )}/>
                <div>
                  <Label htmlFor="edit-isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Account active
                  </Label>
                  <p className="text-xs text-slate-400">Uncheck to suspend this agent's access</p>
                </div>
              </div>

              <DialogFooter className="gap-2 mt-2">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}
                  className="rounded-xl border-slate-200">Cancel</Button>
                <Button type="submit" disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold px-6">
                  {submitting ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════
          DELETE DIALOG
      ═══════════════════════════════════════ */}
      <Dialog open={dialog === "delete"} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-500 to-red-400"/>
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <IconTrash className="w-4 h-4 text-red-600"/>
                </div>
                Delete Agent
              </DialogTitle>
            </DialogHeader>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-red-700">
                You are about to permanently delete{" "}
                <strong>{selected?.businessName || selected?.name}</strong>.
                This action cannot be undone and will remove all their vehicle listings.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={submitting}
                className="rounded-xl border-slate-200 flex-1">Cancel</Button>
              <Button onClick={onDelete} disabled={submitting}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex-1">
                {submitting ? "Deleting…" : "Yes, Delete"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════
          RESET PASSWORD DIALOG
      ═══════════════════════════════════════ */}
      <Dialog open={dialog === "reset"} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400"/>
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <IconKey className="w-4 h-4 text-amber-700"/>
                </div>
                Send Password Reset
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600 mb-2">A password reset link will be sent to:</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
              <IconMail className="w-4 h-4 text-slate-400 flex-shrink-0"/>
              <span className="font-semibold text-slate-800 text-sm">{selected?.email}</span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              The agent will receive an email with a secure link to reset their password. The link expires in 1 hour.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={submitting}
                className="rounded-xl border-slate-200 flex-1">Cancel</Button>
              <Button onClick={onResetPassword} disabled={submitting}
                className="bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold flex-1">
                {submitting ? "Sending…" : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}