import { ColumnDef } from "@tanstack/react-table"
import { PriceDTO } from "@/services/prices/pricesService"

// Define columns for Vehicle Prices table
export const columns: ColumnDef<PriceDTO>[] = [
  {
    accessorKey: "agentName",
    header: "Agent",
  },
  {
    accessorKey: "vehicleName",
    header: "Vehicle",
  },
  {
    accessorKey: "tripTypeName",
    header: "Trip Type",
  },
  {
    accessorKey: "localPerKmPrice",
    header: "Local Per Km",
    cell: ({ row }) => (row.original.localPerKmPrice ?? 0).toFixed(2),
  },
  {
    accessorKey: "localMinKm",
    header: "Local Min Km",
    cell: ({ row }) => (row.original.localMinKm ?? 0).toFixed(2),
  },
  {
    accessorKey: "airportPrice",
    header: "Airport Price",
    cell: ({ row }) => (row.original.airportPrice ?? 0).toFixed(2),
  },
  {
    accessorKey: "outPerKmPrice",
    header: "Outstation Per Km",
    cell: ({ row }) => (row.original.outPerKmPrice ?? 0).toFixed(2),
  },
  {
    accessorKey: "outMinKm",
    header: "Outstation Min Km",
    cell: ({ row }) => (row.original.outMinKm ?? 0).toFixed(2),
  },
]
