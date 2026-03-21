import type { ColumnDef } from "@tanstack/react-table"
import type { vehicleType } from "@/services/admin/vehicleTypesService"

export const columns: ColumnDef<vehicleType>[] = [
  { accessorKey: "iconEmoji",    header: "" },
  { accessorKey: "name",         header: "Name" },
  { accessorKey: "displayName",  header: "Display Name" },
  { accessorKey: "maxSeats",     header: "Max Seats" },
  { accessorKey: "badgeLabel",   header: "Badge" },
  {
    accessorKey: "isPopular",
    header: "Popular",
    cell: ({ row }) => row.original.isPopular ? "★ Yes" : "—",
  },
  { accessorKey: "sortOrder", header: "Order" },
]
