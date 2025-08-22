export type Agent = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  licenseNumber: string;
  createdAt: string;
  modifiedAt: string;
  isActive:boolean;
  role:string;
  password:string;
};

export const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phoneNumber", header: "Phone Number" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "licenseNumber", header: "License Number" },
  { accessorKey: "isActive", header: "Active" },
  { accessorKey: "createdAt", header: "Created At", cell: (info: any) => {
      // 1. Get the raw date string
      const dateString = info.getValue();
      // 2. Create a Date object
      const date = new Date(dateString);
      // 3. Format it using toLocaleDateString()
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },
  },
];