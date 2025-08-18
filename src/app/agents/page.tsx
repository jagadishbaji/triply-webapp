"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { Agent, getAgents, createAgent, updateAgent, deleteAgent } from "@/services/agentsService"
import { toast, Toaster, ToastT } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

// ✅ Zod schema
const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  licenseNumber: z.string().min(1, "License Number is required"),
})

type AgentForm = z.infer<typeof agentSchema>

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AgentForm>({
    resolver: zodResolver(agentSchema),
  })

  // ✅ Fetch agents
  useEffect(() => {
    getAgents()
      .then(setAgents)
      .catch((err) => {
        console.error(err)
        setError("Failed to fetch agents.")
      })
      .finally(() => setLoading(false))
  }, [])

  // ✅ Add Agent
  const onAdd = async (data: AgentForm) => {
    try {
      const newAgent = await createAgent(data)
      setAgents([...agents, newAgent])
      //Toaster({succ})
      setSuccess("Agent added successfully!")
      setError(null)
      setShowAddDialog(false)
      reset()
    } catch {
      setError("Failed to add agent.")
      setSuccess(null)
    }
  }

  // ✅ Edit Agent
  const onEdit = async (data: AgentForm) => {
    if (!selectedAgent) return
    try {
      const updated = await updateAgent(selectedAgent.id, data)
      setAgents(agents.map(a => (a.id === selectedAgent.id ? updated : a)))
      setSuccess("Agent updated successfully!")
      setError(null)
      setShowEditDialog(false)
      reset()
      setSelectedAgent(null)
    } catch {
      setError("Failed to update agent.")
      setSuccess(null)
    }
  }

  // ✅ Delete Agent
  const onDelete = async () => {
    if (!selectedAgent) return
    try {
      await deleteAgent(selectedAgent.id)
      setAgents(agents.filter(a => a.id !== selectedAgent.id))
      setSuccess("Agent deleted successfully!")
      setError(null)
      setShowDeleteDialog(false)
      setSelectedAgent(null)
    } catch {
      setError("Failed to delete agent.")
      setSuccess(null)
    }
  }

  // ✅ Open Edit Dialog
  const openEditDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setValue("name", agent.name)
    setValue("email", agent.email)
    setValue("phoneNumber", agent.phoneNumber)
    setValue("address", agent.address)
    setValue("licenseNumber", agent.licenseNumber)
    setShowEditDialog(true)
  }

  // ✅ Open Delete Dialog
  const openDeleteDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowDeleteDialog(true)
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-6">
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold">Agents</h1>
    <Button onClick={() => {reset();   setShowAddDialog(true)}}>Add Agent</Button>
  </div>

  {/* Alerts */}
  {error && (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )}
  {success && (
    <Alert className="mb-4">
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>{success}</AlertDescription>
    </Alert>
  )}

          {/* DataTable */}
          <DataTable
            columns={[
              ...columns,
              {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {reset(); openEditDialog(row.original)}}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(row.original)}>Delete</Button>
                  </div>
                ),
              },
            ]}
            data={agents}
          />

          {/* Add Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Agent</DialogTitle>
              </DialogHeader>
              <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit(onAdd)}>
                <input {...register("name")} placeholder="Name" className="border p-2 rounded" />
                {errors.name && <p className="text-red-500">{errors.name.message}</p>}

                <input {...register("email")} placeholder="Email" className="border p-2 rounded" />
                {errors.email && <p className="text-red-500">{errors.email.message}</p>}

                <input {...register("phoneNumber")} placeholder="Phone (10 digits)" className="border p-2 rounded" />
                {errors.phoneNumber && <p className="text-red-500">{errors.phoneNumber.message}</p>}

                <input {...register("address")} placeholder="Address" className="border p-2 rounded" />
                {errors.address && <p className="text-red-500">{errors.address.message}</p>}

                <input {...register("licenseNumber")} placeholder="License Number" className="border p-2 rounded" />
                {errors.licenseNumber && <p className="text-red-500">{errors.licenseNumber.message}</p>}

                <DialogFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button type="submit">Add</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Agent</DialogTitle>
              </DialogHeader>
              <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit(onEdit)}>
                <input {...register("name")} placeholder="Name" className="border p-2 rounded" />
                {errors.name && <p className="text-red-500">{errors.name.message}</p>}

                <input {...register("email")} placeholder="Email" className="border p-2 rounded" />
                {errors.email && <p className="text-red-500">{errors.email.message}</p>}

                <input {...register("phoneNumber")} placeholder="Phone (10 digits)" className="border p-2 rounded" />
                {errors.phoneNumber && <p className="text-red-500">{errors.phoneNumber.message}</p>}

                <input {...register("address")} placeholder="Address" className="border p-2 rounded" />
                {errors.address && <p className="text-red-500">{errors.address.message}</p>}

                <input {...register("licenseNumber")} placeholder="License Number" className="border p-2 rounded" />
                {errors.licenseNumber && <p className="text-red-500">{errors.licenseNumber.message}</p>}

                <DialogFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                  <Button type="submit">Update</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Agent</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to delete <strong>{selectedAgent?.name}</strong>?</p>
              <DialogFooter className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={onDelete}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
