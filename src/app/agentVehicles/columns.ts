
export type Vehicle = {
   agentId: string
   vehicletypeId: string
  name: string
  company: string
  seatingCapacity: number   
  id: string
}

export const columns= [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "company",
    header: "Company",
  },
  {
    accessorKey: "seatingCapacity",
    header: "Capacity",
   
  },  
  {
    accessorKey: "createdAt",
    header: "Created At"
  },
//   {
//     id: "actions",
//     header: "Actions",
//     cell: ({ row }) => {
//       const vehicle = row.original

//       return (
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" className="h-8 w-8 p-0">
//               <span className="sr-only">Open menu</span>
//               <MoreHorizontal className="h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem onClick={() => console.log("Edit", vehicle)}>
//               Edit
//             </DropdownMenuItem>
//             <DropdownMenuItem
//               className="text-red-600"
//               onClick={() => console.log("Delete", vehicle)}
//             >
//               Delete
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       )
//     },
//   },
]
