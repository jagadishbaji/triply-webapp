import type { ColumnDef } from "@tanstack/react-table"
import type { Agent } from "@/services/admin/agentsService"

export const columns: ColumnDef<Agent>[] = [
  { accessorKey: "businessName",   header: "Business Name" },
  { accessorKey: "ownerName",      header: "Owner" },
  { accessorKey: "email",          header: "Email" },
  { accessorKey: "phoneNumber",    header: "Phone" },
  { accessorKey: "city",           header: "City" },
  { accessorKey: "licenseNumber",  header: "License No." },
  {
    accessorKey: "approvalStatus",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.approvalStatus
      const map: Record<string, string> = {
        approved:  "bg-green-100 text-green-700",
        pending:   "bg-amber-100 text-amber-700",
        rejected:  "bg-red-100 text-red-700",
        suspended: "bg-slate-100 text-slate-600",
      }
      return (
        `<span class="px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] ?? ""}">${s}</span>`
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: (info: any) => {
      const d = new Date(info.getValue())
      return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB")
    },
  },
]
