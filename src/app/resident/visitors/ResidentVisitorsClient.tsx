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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type ResidentVisitor = {
  id: number;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string | null;
  vehicle_number: string | null;
  status: string;
  pre_approved: boolean;
  unit_number: string | null;
  expected_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
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

export function ResidentVisitorsClient() {
  const [visitors, setVisitors] = useState<ResidentVisitor[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resident/visitors");
      if (!res.ok) throw new Error("Failed to load visitors");
      setVisitors(await res.json());
    } catch {
      toast.error("Could not load visitor history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      toast.error("Visitor name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/resident/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName,
          visitorPhone: visitorPhone || undefined,
          purpose: purpose || undefined,
          vehicleNumber: vehicleNumber || undefined,
          expectedAt: expectedAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to pre-approve visitor");
      }
      toast.success("Visitor pre-approved! They can enter without delay.");
      setVisitorName("");
      setVisitorPhone("");
      setPurpose("");
      setVehicleNumber("");
      setExpectedAt("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const checkedIn = visitors.filter((v) => v.status === "CHECKED_IN").length;
  const expected = visitors.filter((v) => v.status === "EXPECTED").length;

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Total Visitors",
            value: visitors.length,
            color: "text-foreground",
          },
          {
            label: "Currently Inside",
            value: checkedIn,
            color: "text-green-600",
          },
          { label: "Expected Soon", value: expected, color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Pre-approve form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pre-approve a Guest</CardTitle>
          <CardDescription>
            Pre-approved visitors get faster entry at the gate — no wait
            required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Label htmlFor="visitorPhone">Phone Number</Label>
                <Input
                  id="visitorPhone"
                  placeholder="+92 300 0000000"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purpose">Purpose of Visit</Label>
                <Input
                  id="purpose"
                  placeholder="e.g. Family dinner, Plumber"
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
              <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
                <Label htmlFor="expectedAt">Expected Arrival</Label>
                <Input
                  id="expectedAt"
                  type="datetime-local"
                  value={expectedAt}
                  onChange={(e) => setExpectedAt(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : "Pre-approve Visitor"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visitor History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : visitors.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No visitors yet. Pre-approve your first guest above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Purpose
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Vehicle
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Expected
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Checked In
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitors.map((v) => (
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
                      <TableCell className="hidden sm:table-cell text-sm">
                        {v.purpose ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
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
                        {formatDate(v.expected_at)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(v.checked_in_at)}
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
