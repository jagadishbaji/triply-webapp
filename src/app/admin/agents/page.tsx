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
import { DataTable } from "@/components/ui/data-table"
import { Agent, getAgents, createAgent, updateAgent, deleteAgent } from "@/services/admin/agentsService"
import { toast, Toaster, ToastT } from "sonner"
import { PageLoader } from "@/components/ui/loader"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Controller } from "react-hook-form"
import { forgotPassword } from "@/services/authService"

// ✅ Zod schema
const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  licenseNumber: z.string().min(1, "License Number is required"),
  isActive: z.boolean(),
  password: z.string().min(1, "Password is required")
})
//update schem to set password as optional
const agentUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  licenseNumber: z.string().min(1, "License Number is required"),
  isActive: z.boolean(),
  // 🔑 Optional in Edit
  //password: z.string().optional(),
})

type AgentForm = z.infer<typeof agentSchema>
type AgentUpdateForm = z.infer<typeof agentUpdateSchema>
export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  //checkbox
  const [isChecked, setIsChecked] = useState()
// reset password
const [resetPassword, setResetPassword] = useState("")
 const [showResetPwdDialog, setShowResetPwdDialog] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } = useForm<AgentForm>({
    resolver: zodResolver(agentSchema),
  })
 
  //update schema
   const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
    setValue: setValueEdit,
    control: controlEdit,
  } = useForm<AgentUpdateForm>({
    resolver: zodResolver(agentUpdateSchema),
  })

  // ✅ Fetch agents
  useEffect(() => {
    getAgents()
      .then(setAgents)
      .catch((err) => {
        console.error(err)
        toast.success("Failed to fetch agents.")
      })
      .finally(() => setLoading(false))
  }, [])

  // ✅ Add Agent
  const onAdd = async (data: AgentForm) => {
    try {
      const newAgent = await createAgent(data)
      setAgents([...agents, newAgent])
      //Toaster({succ})
      toast.success("Agent added successfully!")

      setShowAddDialog(false)
      reset()
    } catch {
      toast.error("Failed to add agent.")

    }
  }

  // ✅ Edit Agent
  const onEdit = async (data: AgentUpdateForm) => {
    if (!selectedAgent) return
    try {
      const updated = await updateAgent(selectedAgent.id, data)
      setAgents(agents.map(a => (a.id === selectedAgent.id ? updated : a)))
      toast.success("Agent updated successfully!")

      setShowEditDialog(false)
      reset()
      setSelectedAgent(null)
    } catch {
      toast.error("Failed to update agent.")

    }
  }

  // ✅ Delete Agent
  const onDelete = async () => {
    if (!selectedAgent) return
    try {
      await deleteAgent(selectedAgent.id)
      setAgents(agents.filter(a => a.id !== selectedAgent.id))
      toast.success("Agent deleted successfully!")

      setShowDeleteDialog(false)
      setSelectedAgent(null)
    } catch {
      toast.error("Failed to delete agent.")

    }
  }

 // Reset Pwd
 const onResetPassword = async () => {
    if (!selectedAgent) return
    try {      
      await forgotPassword(selectedAgent.email)       
      setAgents(agents.filter(a => a.id !== selectedAgent.id))      
      toast.success("Reset password link sent successfully")

      setShowResetPwdDialog(false)
      setSelectedAgent(null)
    } catch {
      toast.error("Failed to send reset password link")
    }
  }
  // ✅ Open Edit Dialog
  const openEditDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setValueEdit("name", agent.name)
    setValueEdit("email", agent.email)
    setValueEdit("phoneNumber", agent.phoneNumber)
    setValueEdit("address", agent.address)
    setValueEdit("licenseNumber", agent.licenseNumber)
   // setValueEdit("password", agent.password)
    setValueEdit("isActive", agent.isActive)
    setShowEditDialog(true)
  }

  // ✅ Open Delete Dialog
  const openDeleteDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowDeleteDialog(true)
  }
  const openResetPasswordDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowResetPwdDialog(true)
  }

  if (loading) return <PageLoader />

  return (
    <>
      {/* Toast container - must be inside JSX tree */}
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
          <div className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Agents</h1>
              <Button onClick={() => { reset(); setShowAddDialog(true) }}>Add Agent</Button>
            </div>



            {/* DataTable */}
            <DataTable
              columns={[
                ...columns,
                {
                  id: "actions",
                  header: "Actions",
                  cell: ({ row }) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openResetPasswordDialog(row.original)}>Reset Password</Button>
                      <Button size="sm" variant="outline" onClick={() => { reset(); openEditDialog(row.original) }}>Edit</Button>
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

                  <input {...register("password")} placeholder="Password" className="border p-2 rounded" type="password" />
                  {errors.password && <p className="text-red-500">{errors.password.message}</p>}

                  {/* <div className="flex items-center space-x-2">
                  <label>Status</label>
                 <input {...register("isActive")} placeholder="Status" className="border p-2 rounded" type="checkbox"/>
                
                </div> */}

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="isActive">Status</Label>
                    <Controller
                      name="isActive"
                      control={control}
                      defaultValue={false}
                      render={({ field }) => (
                        <Checkbox
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      )}
                    />
                    {errors.isActive && <p className="text-red-500">{errors.isActive.message}</p>}
                  </div>
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
                <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmitEdit(onEdit)}>
                  <input {...registerEdit("name")} placeholder="Name" className="border p-2 rounded" />
                  {errors.name && <p className="text-red-500">{errors.name.message}</p>}

                  <input {...registerEdit("email")} placeholder="Email" className="border p-2 rounded" />
                  {errors.email && <p className="text-red-500">{errors.email.message}</p>}

                  <input {...registerEdit("phoneNumber")} placeholder="Phone (10 digits)" className="border p-2 rounded" />
                  {errors.phoneNumber && <p className="text-red-500">{errors.phoneNumber.message}</p>}

                  <input {...registerEdit("address")} placeholder="Address" className="border p-2 rounded" />
                  {errors.address && <p className="text-red-500">{errors.address.message}</p>}

                  <input {...registerEdit("licenseNumber")} placeholder="License Number" className="border p-2 rounded" />
                  {errors.licenseNumber && <p className="text-red-500">{errors.licenseNumber.message}</p>}

                  {/* <input {...registerEdit("password")} placeholder="Password is optional" className="border p-2 rounded" type="password" />
                  {errors.password && <p className="text-red-500">{errors.password.message}</p>} */}

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="isActive">Status</Label>
                    <Controller
                      name="isActive"
                      control={controlEdit}
                      render={({ field }) => (
                        <Checkbox
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      )}
                    />
                    {errors.isActive && <p className="text-red-500">{errors.isActive.message}</p>}
                  </div>


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

            {/* Reset Password Link */}
            <Dialog open={showResetPwdDialog} onOpenChange={setShowResetPwdDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                </DialogHeader>
                <p>Are you sure you want to send reset password link to <strong>{selectedAgent?.name}</strong> ?</p>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowResetPwdDialog(false)}>No</Button>
                  <Button variant="outline" onClick={onResetPassword}>Yes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
