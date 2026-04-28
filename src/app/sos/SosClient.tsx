"use client";

import { useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type SosAlert = {
  id: number;
  member_name: string | null;
  unit_number: string | null;
  alert_type: string;
  message: string | null;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-red-500/20 text-red-600 border-red-500/30",
  ACKNOWLEDGED: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  RESOLVED: "bg-green-500/20 text-green-600 border-green-500/30",
};

const alertTypeColor: Record<string, string> = {
  MEDICAL: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  FIRE: "bg-red-500/20 text-red-600 border-red-500/30",
  SECURITY: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  OTHER: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

export function SosClient() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [filtered, setFiltered] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actioningId, setActioningId] = useState<number | null>(null);

  // form
  const [memberId, setMemberId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [alertType, setAlertType] = useState("MEDICAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (statusFilter === "ALL") {
      setFiltered(alerts);
    } else {
      setFiltered(alerts.filter((a) => a.status === statusFilter));
    }
  }, [statusFilter, alerts]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/sos");
      if (res.ok) {
        const data = (await res.json()) as SosAlert[];
        setAlerts(data);
        setFiltered(data);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (
    id: number,
    action: "acknowledge" | "resolve",
  ) => {
    setActioningId(id);
    try {
      const res = await fetch("/api/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!res.ok) {
        toast.error(`Failed to ${action} alert`);
        return;
      }

      toast.success(
        action === "acknowledge"
          ? "Alert acknowledged"
          : "Alert marked as resolved",
      );
      await load();
    } finally {
      setActioningId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      toast.error("Member ID is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: Number(memberId),
          unitId: unitId ? Number(unitId) : null,
          alertType,
          message: message || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to create alert");
        return;
      }

      toast.success("Emergency alert created");
      setMemberId("");
      setUnitId("");
      setAlertType("MEDICAL");
      setMessage("");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        {/* FORM */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">
              Trigger Emergency Alert
            </CardTitle>
            <CardDescription>
              Simulate an SOS alert raised by a resident for testing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memberId">Member ID</Label>
                  <Input
                    id="memberId"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    required
                    placeholder="numeric ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitId">Unit ID (optional)</Label>
                  <Input
                    id="unitId"
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    placeholder="numeric ID"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Alert type</Label>
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEDICAL">Medical</SelectItem>
                    <SelectItem value="FIRE">Fire</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Short description of the emergency"
                />
              </div>
              <Button
                type="submit"
                variant="destructive"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? "Creating..." : "Create test alert"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* STATS STRIP */}
        <div className="grid grid-cols-3 gap-3 h-fit">
          {["ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((s) => (
            <Card
              key={s}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() =>
                setStatusFilter((prev) => (prev === s ? "ALL" : s))
              }
            >
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground mb-1">{s}</p>
                <p className="text-2xl font-semibold">
                  {alerts.filter((a) => a.status === s).length}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Emergency Alerts</CardTitle>
              <CardDescription>
                Acknowledge and resolve alerts raised by residents.
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading alerts...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Member
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Unit</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Message
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Created
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Resolved
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            alertTypeColor[a.alert_type] ?? ""
                          }`}
                        >
                          {a.alert_type}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {a.member_name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {a.unit_number ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-35 truncate">
                        {a.message ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            statusColor[a.status] ?? ""
                          }`}
                        >
                          {a.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(a.created_at)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(a.resolved_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {a.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={actioningId === a.id}
                              onClick={() => handleAction(a.id, "acknowledge")}
                            >
                              Acknowledge
                            </Button>
                          )}
                          {(a.status === "ACTIVE" ||
                            a.status === "ACKNOWLEDGED") && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              disabled={actioningId === a.id}
                              onClick={() => handleAction(a.id, "resolve")}
                            >
                              Resolve
                            </Button>
                          )}
                          {a.status === "RESOLVED" && (
                            <span className="text-xs text-muted-foreground">
                              Done
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
