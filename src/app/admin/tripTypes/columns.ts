import type { ColumnDef } from "@tanstack/react-table"
import type { tripType } from "@/services/admin/tripTypesService"

export const columns: ColumnDef<tripType>[] = [
  { accessorKey: "name",     header: "Trip Type Name" },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => row.original.isActive ? "Active" : "Inactive",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: (info: any) => {
      const d = new Date(info.getValue())
      return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB")
    },
  },
]
