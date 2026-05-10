"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type PatrolLog = {
  id: number;
  guard_name: string;
  checkpoint: string;
  notes: string | null;
  status: string;
  created_at: string;
};

const CHECKPOINTS = [
  "Main Entrance Gate",
  "Back Gate",
  "Block A — Ground Floor",
  "Block A — Rooftop",
  "Block B — Ground Floor",
  "Block B — Rooftop",
  "Parking Area",
  "Swimming Pool",
  "Playground / Park",
  "Generator Room",
  "Basement",
  "Guard Room",
  "Society Office",
];

const statusColor: Record<string, string> = {
  COMPLETED: "bg-green-500/20 text-green-600 border-green-500/30",
  ISSUE_FOUND: "bg-red-500/20 text-red-600 border-red-500/30",
  SKIPPED: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PatrolsClient() {
  const [logs, setLogs] = useState<PatrolLog[]>([]);
  const [filtered, setFiltered] = useState<PatrolLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [guardName, setGuardName] = useState("");
  const [checkpoint, setCheckpoint] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("COMPLETED");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patrols");
      if (!res.ok) throw new Error("Failed to load");
      setLogs(await res.json());
    } catch {
      toast.error("Could not load patrol logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let r = logs;
    if (statusFilter !== "ALL") r = r.filter((l) => l.status === statusFilter);
    if (search.trim())
      r = r.filter(
        (l) =>
          l.guard_name.toLowerCase().includes(search.toLowerCase()) ||
          l.checkpoint.toLowerCase().includes(search.toLowerCase()),
      );
    setFiltered(r);
  }, [search, statusFilter, logs]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guardName || !checkpoint) {
      toast.error("Guard name and checkpoint are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/patrols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardName,
          checkpoint,
          notes: notes || undefined,
          status,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
      toast.success("Patrol checkpoint logged");
      setGuardName("");
      setCheckpoint("");
      setNotes("");
      setStatus("COMPLETED");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toDateString();
  const todayLogs = logs.filter(
    (l) => new Date(l.created_at).toDateString() === today,
  );
  const issues = logs.filter((l) => l.status === "ISSUE_FOUND").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Today's Rounds",
            value: todayLogs.length,
            color: "text-foreground",
          },
          {
            label: "Completed",
            value: todayLogs.filter((l) => l.status === "COMPLETED").length,
            color: "text-green-600",
          },
          { label: "Issues Found", value: issues, color: "text-red-600" },
          { label: "Total Logged", value: logs.length, color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Log Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log Patrol Checkpoint</CardTitle>
          <CardDescription>
            Record a guard's checkpoint scan or patrol observation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="guardName">Guard Name *</Label>
                <Input
                  id="guardName"
                  placeholder="e.g. Imran Khan"
                  value={guardName}
                  onChange={(e) => setGuardName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkpoint">Checkpoint *</Label>
                <Select value={checkpoint} onValueChange={setCheckpoint}>
                  <SelectTrigger id="checkpoint">
                    <SelectValue placeholder="Select checkpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECKPOINTS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="patrolStatus">Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="patrolStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETED">✅ Completed</SelectItem>
                    <SelectItem value="ISSUE_FOUND">🚨 Issue Found</SelectItem>
                    <SelectItem value="SKIPPED">⏭ Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="patrolNotes">Notes / Observations</Label>
                <Textarea
                  id="patrolNotes"
                  placeholder="Describe any findings, issues or observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Logging..." : "Log Checkpoint"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search guard or checkpoint..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ISSUE_FOUND">Issue Found</SelectItem>
            <SelectItem value="SKIPPED">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No patrol logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guard</TableHead>
                    <TableHead>Checkpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Notes
                    </TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">
                        {l.guard_name}
                      </TableCell>
                      <TableCell className="text-sm">{l.checkpoint}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColor[l.status]}
                        >
                          {l.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                        {l.notes ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(l.created_at)}
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
