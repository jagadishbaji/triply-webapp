"use client";

import { useEffect, useState, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { ColumnDef } from "@tanstack/react-table";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  IconUserCheck,
  IconUserX,
  IconRefresh,
  IconSearch,
  IconMail,
  IconPhone,
  IconMapPin,
  IconLicense,
  IconClock,
  IconCircleCheckFilled,
  IconBan,
  IconAlertTriangle,
} from "@tabler/icons-react";

import {
  Agent,
  getInActiveAgents,
  approveAgent,
  rejectAgent,
  updateAgentStatus,
} from "@/services/admin/agentsService";

// ─── Stats card ───────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ─── Agent detail row in dialog ────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-sm font-semibold text-slate-800 break-all">{value || "—"}</div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function ApproveAgentsPage() {
  const [agents,    setAgents]    = useState<Agent[]>([]);
  const [filtered,  setFiltered]  = useState<Agent[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  // Single dialog state: "approve" | "reject" | "detail" | null
  const [dialog,    setDialog]    = useState<"approve" | "reject" | "detail" | null>(null);
  const [selected,  setSelected]  = useState<Agent | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Track recently processed so we can animate them out
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInActiveAgents();
      // API should return inactive only, but filter defensively
      const pending = (data || []).filter((a) => !a.isActive);
      setAgents(pending);
      setFiltered(pending);
    } catch {
      toast.error("Failed to fetch pending agents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // ── Search filter ────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(
      q
        ? agents.filter((a) =>
            a.name.toLowerCase().includes(q) ||
            a.email.toLowerCase().includes(q) ||
            a.phoneNumber.includes(q) ||
            a.licenseNumber.toLowerCase().includes(q) ||
            a.address.toLowerCase().includes(q)
          )
        : agents
    );
  }, [search, agents]);

  // ── Helpers ──────────────────────────────────────────────────────────
  const openApprove = (agent: Agent) => { setSelected(agent); setDialog("approve"); };
  const openReject  = (agent: Agent) => { setSelected(agent); setDialog("reject"); };
  const openDetail  = (agent: Agent) => { setSelected(agent); setDialog("detail"); };
  const closeDialog = () => { setDialog(null); setSelected(null); };

  const removeAgent = (id: string) => {
    setProcessingId(id);
    setTimeout(() => {
      setAgents((prev) => prev.filter((a) => a.id !== id));
      setProcessingId(null);
    }, 350);
  };

  // ── Approve ──────────────────────────────────────────────────────────
  const onApprove = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await approveAgent(selected.id);
      removeAgent(selected.id);
      toast.success(`${selected.name} has been approved and can now log in.`);
      closeDialog();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve agent.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reject ───────────────────────────────────────────────────────────
  const onReject = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await rejectAgent(selected.id, rejectReason || "Rejected by admin");
      removeAgent(selected.id);
      toast.success(`${selected.name}'s application has been rejected.`);
      closeDialog();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject agent.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Inline reject (no dialog, direct from table row) ─────────────────
  const onQuickReject = async (agent: Agent) => {
    try {
      await rejectAgent(agent.id, rejectReason || "Rejected by admin");
      removeAgent(agent.id);
      toast.success(`${agent.businessName ?? agent.businessName ?? agent.name}'s application has been rejected.`);
    } catch {
      toast.error("Failed to reject agent.");
    }
  };

  // ── Table columns ────────────────────────────────────────────────────
  const columns: ColumnDef<Agent>[] = [
    {
      accessorKey: "name",
      header: "Agent",
      cell: ({ row }) => {
        const initials = row.original.name
          .split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
        const d = new Date(row.original.createdAt);
        const dateStr = isNaN(d.getTime())
          ? "—"
          : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-xs font-black text-amber-700 flex-shrink-0">
              {initials}
            </div>
            <div>
              <button
                onClick={() => openDetail(row.original)}
                className="font-semibold text-slate-900 text-sm hover:text-green-700 transition-colors text-left"
              >
                {row.original.name}
              </button>
              <div className="text-xs text-slate-500">{row.original.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{row.original.phoneNumber}</span>
      ),
    },
    {
      accessorKey: "licenseNumber",
      header: "License No.",
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
          {row.original.licenseNumber}
        </span>
      ),
    },
    {
      accessorKey: "address",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[180px] truncate block" title={row.original.address}>
          {row.original.address}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Applied",
      cell: ({ row }) => {
        const d = new Date(row.original.createdAt);
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <IconClock className="w-3.5 h-3.5 text-slate-400" />
            {isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: () => (
        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1 font-semibold text-xs">
          <IconClock className="w-3 h-3" /> Pending
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            className="h-8 px-3 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold flex items-center gap-1"
            onClick={() => openApprove(row.original)}
          >
            <IconCircleCheckFilled className="w-3.5 h-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg font-semibold flex items-center gap-1"
            onClick={() => openReject(row.original)}
          >
            <IconBan className="w-3.5 h-3.5" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800 rounded-lg"
            onClick={() => openDetail(row.original)}
            title="View full details"
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <PageLoader />;

  const pendingCount = agents.length;

  return (
    <>
      <Toaster richColors position="top-right" />
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />

          <div className="flex flex-1 flex-col p-6 bg-slate-50 min-h-full">

            {/* ── Page header ──────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Pending Approvals</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Review and approve agent registration requests
                </p>
              </div>
              <Button
                variant="outline"
                onClick={fetchAgents}
                className="h-10 px-4 border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-2 self-start sm:self-auto"
              >
                <IconRefresh className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            {/* ── Stats ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Pending Approvals" value={pendingCount}              icon={IconClock}       color="bg-amber-500" />
              <StatCard label="Approved Today"    value={0}                         icon={IconUserCheck}   color="bg-green-600" />
              <StatCard label="Rejected Today"    value={0}                         icon={IconUserX}       color="bg-red-500"   />
            </div>

            {/* ── Pending alert banner ─────────────────────────────── */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                <IconAlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  <strong>{pendingCount}</strong> agent{pendingCount !== 1 ? "s" : ""} waiting for approval.
                  Review their details and approve or reject each request.
                </p>
              </div>
            )}

            {/* ── Search ───────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 h-10 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 transition-all">
                <IconSearch className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone or license..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-800"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-600 ml-2 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* ── Table or empty state ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                    <IconCircleCheckFilled className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-slate-800 font-bold text-lg mb-1">
                    {search ? "No matching agents" : "All caught up!"}
                  </h3>
                  <p className="text-slate-400 text-sm max-w-xs">
                    {search
                      ? "Try a different search term."
                      : "There are no pending agent approvals right now. New requests will appear here when agents sign up."}
                  </p>
                </div>
              ) : (
                <DataTable columns={columns} data={filtered} />
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* ══════════════════════════════════════════════════════════════
          APPROVE DIALOG
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "approve"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <IconCircleCheckFilled className="w-4 h-4 text-green-600" />
                </div>
                Approve Agent
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                This will grant the agent full access to list vehicles and receive bookings.
              </DialogDescription>
            </DialogHeader>

            {/* Agent preview */}
            {selected && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-sm font-black text-green-800">
                    {selected.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{selected.name}</div>
                    <div className="text-xs text-slate-500">{selected.email}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <IconPhone className="w-3.5 h-3.5" />
                    {selected.phoneNumber}
                  </div>
                  <div className="flex items-center gap-2">
                    <IconLicense className="w-3.5 h-3.5" />
                    {selected.licenseNumber}
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-600 mb-5">
              Approving will send them a notification and allow them to start listing their vehicles on <strong>Triply Cars</strong>.
            </p>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={submitting}
                className="rounded-xl border-slate-200 flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={onApprove}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex-1"
              >
                {submitting ? "Approving..." : "Yes, Approve"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════
          REJECT DIALOG
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "reject"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-500 to-red-400" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <IconBan className="w-4 h-4 text-red-600" />
                </div>
                Reject Application
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                The agent will remain inactive and will not be able to log in.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-red-700">
                You are rejecting the application from{" "}
                <strong>{selected?.name}</strong> ({selected?.email}).
                They will not receive access to the platform.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={submitting}
                className="rounded-xl border-slate-200 flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={onReject}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex-1"
              >
                {submitting ? "Rejecting..." : "Reject Application"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════
          DETAIL DIALOG — full agent info before deciding
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={dialog === "detail"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-slate-600 to-slate-500" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-black text-slate-900">
                Agent Application
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Review the full details before approving or rejecting.
              </DialogDescription>
            </DialogHeader>

            {selected && (
              <>
                {/* Avatar + name */}
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-lg font-black text-amber-700">
                    {selected.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">{selected.name}</div>
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1 mt-1 text-xs">
                      <IconClock className="w-3 h-3" /> Pending Review
                    </Badge>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <DetailRow icon={IconMail}    label="Email"          value={selected.email} />
                  <DetailRow icon={IconPhone}   label="Mobile"         value={selected.phoneNumber} />
                  <DetailRow icon={IconLicense} label="License / Reg." value={selected.licenseNumber} />
                  <DetailRow icon={IconClock}   label="Applied on"     value={
                    isNaN(new Date(selected.createdAt).getTime())
                      ? "—"
                      : new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                  } />
                  <div className="sm:col-span-2">
                    <DetailRow icon={IconMapPin} label="Business Address" value={selected.address} />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button
                    onClick={() => { closeDialog(); setTimeout(() => openReject(selected), 50); }}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold flex items-center gap-2"
                  >
                    <IconBan className="w-4 h-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => { closeDialog(); setTimeout(() => openApprove(selected), 50); }}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2"
                  >
                    <IconCircleCheckFilled className="w-4 h-4" />
                    Approve
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}