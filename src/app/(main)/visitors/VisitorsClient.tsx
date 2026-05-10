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
import { Checkbox } from "@/components/ui/checkbox";

type Visitor = {
  id: number;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string | null;
  vehicle_number: string | null;
  status: string;
  pre_approved: boolean;
  member_name: string | null;
  unit_number: string | null;
  expected_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
};

type Member = {
  id: number;
  first_name: string;
  last_name: string | null;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColor: Record<string, string> = {
  EXPECTED: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  CHECKED_IN: "bg-green-500/20 text-green-600 border-green-500/30",
  CHECKED_OUT: "bg-gray-500/20 text-gray-600 border-gray-500/30",
  DENIED: "bg-red-500/20 text-red-600 border-red-500/30",
};

export function VisitorsClient() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filtered, setFiltered] = useState<Visitor[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // form state
  const [memberId, setMemberId] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [preApproved, setPreApproved] = useState(false);
  const [expectedAt, setExpectedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, mRes] = await Promise.all([
        fetch("/api/visitors"),
        fetch("/api/members"),
      ]);
      if (!vRes.ok || !mRes.ok) throw new Error("Failed to load data");
      const [v, m] = await Promise.all([vRes.json(), mRes.json()]);
      setVisitors(v);
      setFiltered(v);
      setMembers(m);
    } catch {
      toast.error("Could not load visitor data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = visitors;
    if (statusFilter !== "ALL")
      result = result.filter((v) => v.status === statusFilter);
    if (search.trim())
      result = result.filter(
        (v) =>
          v.visitor_name.toLowerCase().includes(search.toLowerCase()) ||
          v.member_name?.toLowerCase().includes(search.toLowerCase()) ||
          v.purpose?.toLowerCase().includes(search.toLowerCase()),
      );
    setFiltered(result);
  }, [search, statusFilter, visitors]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!memberId || !visitorName) {
      toast.error("Member and visitor name are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: Number(memberId),
          visitorName,
          visitorPhone: visitorPhone || undefined,
          purpose: purpose || undefined,
          vehicleNumber: vehicleNumber || undefined,
          preApproved,
          expectedAt: expectedAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to add visitor");
      }
      toast.success("Visitor logged successfully");
      setVisitorName("");
      setVisitorPhone("");
      setPurpose("");
      setVehicleNumber("");
      setMemberId("");
      setPreApproved(false);
      setExpectedAt("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/visitors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(
        `Visitor marked as ${status.replace("_", " ").toLowerCase()}`,
      );
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  // stats
  const today = new Date().toDateString();
  const todayVisitors = visitors.filter(
    (v) => new Date(v.created_at).toDateString() === today,
  ).length;
  const checkedIn = visitors.filter((v) => v.status === "CHECKED_IN").length;
  const expected = visitors.filter((v) => v.status === "EXPECTED").length;
  const denied = visitors.filter((v) => v.status === "DENIED").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Today's Visitors",
            value: todayVisitors,
            color: "text-blue-600",
          },
          { label: "Currently In", value: checkedIn, color: "text-green-600" },
          { label: "Expected", value: expected, color: "text-yellow-600" },
          { label: "Denied", value: denied, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Add Visitor Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log New Visitor</CardTitle>
          <CardDescription>
            Record a visitor entry or pre-approve a guest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="member">Visiting Member *</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger id="member">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.first_name} {m.last_name ?? ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="visitorName">Visitor Name *</Label>
                <Input
                  id="visitorName"
                  placeholder="Full name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="visitorPhone">Visitor Phone</Label>
                <Input
                  id="visitorPhone"
                  placeholder="+92 300 0000000"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  placeholder="e.g. Family visit, Delivery"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g. LHR-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expectedAt">Expected Arrival</Label>
                <Input
                  id="expectedAt"
                  type="datetime-local"
                  value={expectedAt}
                  onChange={(e) => setExpectedAt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="preApproved"
                checked={preApproved}
                onCheckedChange={(v) => setPreApproved(Boolean(v))}
              />
              <Label
                htmlFor="preApproved"
                className="cursor-pointer font-normal"
              >
                Pre-approved guest (faster entry at gate)
              </Label>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Logging..." : "Log Visitor"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name, member or purpose..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="EXPECTED">Expected</SelectItem>
            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
            <SelectItem value="DENIED">Denied</SelectItem>
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
              No visitors found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Visiting</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Purpose
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Vehicle
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Check In
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Check Out
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="font-medium">{v.visitor_name}</div>
                        {v.visitor_phone && (
                          <div className="text-xs text-muted-foreground">
                            {v.visitor_phone}
                          </div>
                        )}
                        {v.pre_approved && (
                          <span className="text-xs text-blue-600 font-medium">
                            ✓ Pre-approved
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {v.member_name ?? "—"}
                        </div>
                        {v.unit_number && (
                          <div className="text-xs text-muted-foreground">
                            Unit {v.unit_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {v.purpose ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {v.vehicle_number ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColor[v.status]}
                        >
                          {v.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {formatDate(v.checked_in_at)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(v.checked_out_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {v.status === "EXPECTED" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-green-600 border-green-500/40 hover:bg-green-500/10"
                                disabled={updatingId === v.id}
                                onClick={() => updateStatus(v.id, "CHECKED_IN")}
                              >
                                Check In
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600 border-red-500/40 hover:bg-red-500/10"
                                disabled={updatingId === v.id}
                                onClick={() => updateStatus(v.id, "DENIED")}
                              >
                                Deny
                              </Button>
                            </>
                          )}
                          {v.status === "CHECKED_IN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-gray-600 border-gray-500/40 hover:bg-gray-500/10"
                              disabled={updatingId === v.id}
                              onClick={() => updateStatus(v.id, "CHECKED_OUT")}
                            >
                              Check Out
                            </Button>
                          )}
                          {(v.status === "CHECKED_OUT" ||
                            v.status === "DENIED") && (
                            <span className="text-xs text-muted-foreground">
                              —
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
