import type { ColumnDef } from "@tanstack/react-table"
import type { Vehicle } from "@/services/admin/agentVehiclesService"

export const columns: ColumnDef<Vehicle>[] = [
  { accessorKey: "name",            header: "Vehicle Name" },
  { accessorKey: "company",         header: "Brand" },
  { accessorKey: "seatingCapacity", header: "Seats" },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => row.original.isActive
      ? '<span class="text-green-600 font-semibold">Active</span>'
      : '<span class="text-slate-400">Inactive</span>',
  },
  {
    accessorKey: "createdAt",
    header: "Added",
    cell: (info: any) => {
      const d = new Date(info.getValue())
      return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB")
    },
  },
]
