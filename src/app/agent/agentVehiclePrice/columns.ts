import type { ColumnDef } from "@tanstack/react-table"
import type { PriceDetailsByTrip } from "@/services/prices/pricesService"

const fmt = (v?: number) => v != null ? `₹${v.toFixed(2)}` : "—"

export const columns: ColumnDef<PriceDetailsByTrip>[] = [
  { accessorKey: "vehicleName",     header: "Vehicle" },
  { accessorKey: "tripTypeName",    header: "Trip Type" },
  { accessorKey: "localPerKmPrice", header: "Local/km",   cell: ({ row }) => fmt(row.original.localPerKmPrice) },
  { accessorKey: "localMinKm",      header: "Min km",     cell: ({ row }) => row.original.localMinKm ?? "—" },
  { accessorKey: "airportPrice",    header: "Airport",    cell: ({ row }) => fmt(row.original.airportPrice) },
  { accessorKey: "outPerKmPrice",   header: "Out/km",     cell: ({ row }) => fmt(row.original.outPerKmPrice) },
  { accessorKey: "outMinKm",        header: "Out min km", cell: ({ row }) => row.original.outMinKm ?? "—" },
  { accessorKey: "driverDayAllowance",   header: "Driver/day", cell: ({ row }) => fmt(row.original.driverDayAllowance) },
  { accessorKey: "driverNightAllowance", header: "Night allowance", cell: ({ row }) => fmt(row.original.driverNightAllowance) },
  { accessorKey: "tollIncluded",    header: "Tolls",      cell: ({ row }) => row.original.tollIncluded ? "Included" : "Extra" },
]
