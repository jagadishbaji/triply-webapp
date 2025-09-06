"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle,DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PageLoader } from "@/components/ui/loader"
import { Toaster } from "sonner"
import { columns } from "./columns"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { DataTable } from "@/components/ui/data-table"

import { gettripTypes,addtripType,updatetripType,deletetripType,tripType } from "@/services/admin/tripTypesService"
type TripTypes = {
  id: string
  name: string
}
// ✅ Zod schema
const tripTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

type tripTypeForm = z.infer<typeof tripTypeSchema>


export default function TripTypesPage() {
  const [tripTypes, setTripTypes] = useState<TripTypes[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [selected, setSelected] = useState<TripTypes | null>(null)
  const [name, setName] = useState("")
 const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<tripTypeForm>({
    resolver: zodResolver(tripTypeSchema),})
  // ✅ Load data
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await gettripTypes()
        setTripTypes(data)
      } catch {
        toast.error("Failed to load trip types")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ✅ Add
  const onAdd = async (data: tripTypeForm) => {
    try {
      const newType = await addtripType(data)
      setTripTypes([...tripTypes, newType])
      toast.success("Trip type added successfully")
      setShowAddDialog(false)
    reset()
    } catch {
      toast.error("Failed to add trip type")
    }
  }

  // ✅ Edit
  const onEdit = async (data: tripTypeForm) => {
    if (!selected) return
    try {
      const updated = await updatetripType(selected.id, data)
      setTripTypes(tripTypes.map(v => (v.id === selected.id ? updated : v)))
      toast.success("Trip type updated successfully")
      setShowEditDialog(false)
      setSelected(null)
      reset()
    } catch {
      toast.error("Failed to update trip type")
    }
  }

  // ✅ Delete
  const onDelete = async () => {
    if (!selected) return
    try {
      await deletetripType(selected.id)
      setTripTypes(tripTypes.filter(v => v.id !== selected.id))
      toast.success("Trip type deleted successfully")
      setShowDeleteDialog(false)
      setSelected(null)
    } catch {
      toast.error("Failed to delete trip type")
    }
  }
    // ✅ Open Edit Dialog
    const openEditDialog = (tripType: tripType) => {
      setSelected(tripType)
      setValue("name", tripType.name)    
      setShowEditDialog(true)
    }
  
    // ✅ Open Delete Dialog
    const openDeleteDialog = (tripType: tripType) => {
      setSelected(tripType)
      setShowDeleteDialog(true)
    }
  
 if (loading) return <PageLoader />
  return (
    <>
     <Toaster richColors position="top-right" />
     <SidebarProvider 
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}>
        <AppSidebar variant="inset" />
        <SidebarInset>
            <SiteHeader>

            </SiteHeader>
    <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between mb-4">
 <h1 className="text-2xl font-bold">Trip Types</h1>
  <Button onClick={() =>{reset(), setShowAddDialog(true)} }>Add Trip Type</Button>
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
                         <Button size="sm" variant="outline" onClick={() => {reset(); openEditDialog(row.original)}}>Edit</Button>
                         <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(row.original)}>Delete</Button>
                       </div>
                     ),
                   },
                 ]}
                 data={tripTypes}
               />
     
     

      
      {/* ✅ Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Trip Type</DialogTitle>
          </DialogHeader>
          <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit(onAdd)}>
                <input {...register("name")} placeholder="Name" className="border p-2 rounded" />
                {errors.name && <p className="text-red-500">{errors.name.message}</p>}                

                <DialogFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button type="submit">Add</Button>
                </DialogFooter>
              </form>
        </DialogContent>
      </Dialog>

      {/* ✅ Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip Type</DialogTitle>
          </DialogHeader>
         <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit(onEdit)}>
                <input {...register("name")} placeholder="Name" className="border p-2 rounded" />
                {errors.name && <p className="text-red-500">{errors.name.message}</p>}

               

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
              <p>Are you sure you want to delete <strong>{selected?.name}</strong>?</p>
              <DialogFooter className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={onDelete}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    </div>
        </SidebarInset>
      </SidebarProvider>

    
    </>
  )
}
