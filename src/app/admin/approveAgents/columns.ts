import type { ColumnDef } from "@tanstack/react-table"
import type { Agent } from "@/services/admin/agentsService"

export const columns: ColumnDef<Agent>[] = [
  { accessorKey: "businessName",  header: "Business Name" },
  { accessorKey: "ownerName",     header: "Owner" },
  { accessorKey: "email",         header: "Email" },
  { accessorKey: "phoneNumber",   header: "Phone" },
  { accessorKey: "address",       header: "Address" },
  { accessorKey: "licenseNumber", header: "License No." },
  {
    accessorKey: "createdAt",
    header: "Applied On",
    cell: (info: any) => {
      const d = new Date(info.getValue())
      return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB")
    },
  },
]
