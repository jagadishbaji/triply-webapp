"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { toast, Toaster } from "sonner";
import { PageLoader } from "@/components/ui/loader";
import { columns } from "./columns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Agent, getAgents, updateAgentStatus,getInActiveAgents } from "@/services/agentsService";

// Table columns
// const columns = [
//   {
//     accessorKey: "name",
//     header: "Name",
//   },
//   {
//     accessorKey: "email",
//     header: "Email",
//   },
//   {
//     accessorKey: "phoneNumber",
//     header: "Phone",
//   },
//   {
//     accessorKey: "licenseNumber",
//     header: "License #",
//   },
//   {
//     accessorKey: "createdAt",
//     header: "Created At",
//     cell: ({ row }: any) =>
//       new Date(row.original.createdAt).toLocaleDateString(),
//   },
// ];

export default function ApproveAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // ✅ Fetch only inactive agents
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const all = await getInActiveAgents();
      const inactive = all.filter((a) => !a.isActive);
      setAgents(inactive);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch agents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // ✅ Approve Agent (status = true)
  const onApprove = async () => {
    if (!selectedAgent) return;
    try {
      await updateAgentStatus(selectedAgent.id, true);
      setAgents(agents.filter((a) => a.id !== selectedAgent.id));
      toast.success(`Agent ${selectedAgent.name} approved successfully!`);
      setShowApproveDialog(false);
      setSelectedAgent(null);
    } catch {
      toast.error("Failed to approve agent.");
    }
  };

  // ❌ Reject Agent (status = false)
  const onReject = async (agent: Agent) => {
    try {
      await updateAgentStatus(agent.id, false);
      setAgents(agents.filter((a) => a.id !== agent.id));
      toast.success(`Agent ${agent.name} rejected.`);
    } catch {
      toast.error("Failed to reject agent.");
    }
  };

  // ✅ Open Approve Dialog
  const openApproveDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowApproveDialog(true);
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <Toaster richColors position="top-right" />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Approve Pending Agents</h1>
            </div>

            <DataTable
              columns={[
                ...columns,
                {
                  id: "actions",
                  header: "Actions",
                  cell: ({ row }: any) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => openApproveDialog(row.original)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(row.original)}
                      >
                        Reject
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={agents}
            />

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Agent</DialogTitle>
                </DialogHeader>
                <p>
                  Are you sure you want to approve{" "}
                  <strong>{selectedAgent?.name}</strong>?
                </p>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowApproveDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="default" onClick={onApprove}>
                    Approve
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
