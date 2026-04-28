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
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";

type Complaint = {
  id: number;
  member_name: string | null;
  unit_number: string | null;
  category_name: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusColor: Record<string, string> = {
  OPEN: "bg-red-500/20 text-red-600 border-red-500/30",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  RESOLVED: "bg-green-500/20 text-green-600 border-green-500/30",
  CLOSED: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

const priorityColor: Record<string, string> = {
  URGENT: "bg-red-500/20 text-red-600 border-red-500/30",
  HIGH: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  LOW: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

export function ComplaintsClient() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filtered, setFiltered] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [memberId, setMemberId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = complaints;
    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.subject.toLowerCase().includes(q) ||
          (c.member_name ?? "").toLowerCase().includes(q) ||
          (c.unit_number ?? "").toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [search, statusFilter, complaints]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/complaints");
      if (res.ok) {
        const data = (await res.json()) as Complaint[];
        setComplaints(data);
        setFiltered(data);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }
      toast.success("Complaint status updated");
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c)),
      );
    } finally {
      setUpdatingId(null);
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
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: Number(memberId),
          unitId: unitId ? Number(unitId) : null,
          subject,
          description,
          priority,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to log complaint");
        return;
      }
      toast.success("Complaint logged successfully");
      setMemberId("");
      setUnitId("");
      setSubject("");
      setDescription("");
      setPriority("MEDIUM");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        {/* FORM */}
        <Card>
          <CardHeader>
            <CardTitle>Log Complaint</CardTitle>
            <CardDescription>
              Capture issues and service requests raised by residents.
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
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="e.g. Water leakage in corridor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Detailed description of the issue"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Logging...
                  </span>
                ) : (
                  "Log complaint"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* STATS STRIP */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
              <Card
                key={s}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() =>
                  setStatusFilter((prev) => (prev === s ? "ALL" : s))
                }
              >
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    {s.replace("_", " ")}
                  </p>
                  <p className="text-2xl font-semibold">
                    {complaints.filter((c) => c.status === s).length}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Complaints & Requests</CardTitle>
          <CardDescription>
            Click the status badge to update a complaint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by subject, member or unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} complaint{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24 hidden sm:block" />
                  <Skeleton className="h-4 w-16 hidden md:block" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-32 hidden lg:block" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No complaints found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Member
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Unit</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead>Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-35">
                        <div className="flex flex-col">
                          <span className="font-medium truncate">
                            {c.subject}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {c.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {c.member_name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {c.unit_number ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            priorityColor[c.priority] ?? ""
                          }`}
                        >
                          {c.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            statusColor[c.status] ?? ""
                          }`}
                        >
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(c.created_at)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={c.status}
                          onValueChange={(val) => handleStatusChange(c.id, val)}
                          disabled={updatingId === c.id}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="IN_PROGRESS">
                              In Progress
                            </SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
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
