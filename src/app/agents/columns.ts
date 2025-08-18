export type Agent = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  licenseNumber: string;
  createdAt: string;
};

export const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phoneNumber", header: "Phone Number" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "licenseNumber", header: "License Number" },
  { accessorKey: "createdAt", header: "Created At" },
];