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

type GateLog = {
  id: number;
  person_name: string;
  person_type: string;
  direction: string;
  vehicle_number: string | null;
  unit_ref: string | null;
  purpose: string | null;
  gate: string | null;
  created_at: string;
};

const PERSON_TYPES = [
  "VISITOR",
  "STAFF",
  "VENDOR",
  "RESIDENT",
  "DELIVERY",
  "OTHER",
];
const GATES = ["Main Gate", "Back Gate", "Side Gate", "Emergency Gate"];

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GateLogClient() {
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [filtered, setFiltered] = useState<GateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dirFilter, setDirFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [personName, setPersonName] = useState("");
  const [personType, setPersonType] = useState("");
  const [direction, setDirection] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [unitRef, setUnitRef] = useState("");
  const [purpose, setPurpose] = useState("");
  const [gate, setGate] = useState("Main Gate");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gate-log");
      if (!res.ok) throw new Error("Failed to load");
      setLogs(await res.json());
    } catch {
      toast.error("Could not load gate logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let r = logs;
    if (dirFilter !== "ALL") r = r.filter((l) => l.direction === dirFilter);
    if (typeFilter !== "ALL") r = r.filter((l) => l.person_type === typeFilter);
    if (search.trim())
      r = r.filter(
        (l) =>
          l.person_name.toLowerCase().includes(search.toLowerCase()) ||
          l.unit_ref?.toLowerCase().includes(search.toLowerCase()),
      );
    setFiltered(r);
  }, [search, dirFilter, typeFilter, logs]);

  const today = new Date().toDateString();
  const todayIn = logs.filter(
    (l) =>
      new Date(l.created_at).toDateString() === today && l.direction === "IN",
  ).length;
  const todayOut = logs.filter(
    (l) =>
      new Date(l.created_at).toDateString() === today && l.direction === "OUT",
  ).length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!personName || !personType || !direction) {
      toast.error("Name, type and direction are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/gate-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName,
          personType,
          direction,
          vehicleNumber: vehicleNumber || undefined,
          unitRef: unitRef || undefined,
          purpose: purpose || undefined,
          gate,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
      toast.success(
        `${direction === "IN" ? "Entry" : "Exit"} logged for ${personName}`,
      );
      setPersonName("");
      setPersonType("");
      setDirection("");
      setVehicleNumber("");
      setUnitRef("");
      setPurpose("");
      setGate("Main Gate");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Today's Entries", value: todayIn, color: "text-green-600" },
          { label: "Today's Exits", value: todayOut, color: "text-red-600" },
          {
            label: "Total Logged",
            value: logs.length,
            color: "text-foreground",
          },
          {
            label: "Currently Inside",
            value: todayIn - todayOut > 0 ? todayIn - todayOut : 0,
            color: "text-blue-600",
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Quick Log Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log Gate Event</CardTitle>
          <CardDescription>
            Record an entry or exit at any society gate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="personName">Person Name *</Label>
                <Input
                  id="personName"
                  placeholder="Full name"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="personType">Person Type *</Label>
                <Select value={personType} onValueChange={setPersonType}>
                  <SelectTrigger id="personType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSON_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direction">Direction *</Label>
                <Select value={direction} onValueChange={setDirection}>
                  <SelectTrigger id="direction">
                    <SelectValue placeholder="IN or OUT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">🟢 IN — Entry</SelectItem>
                    <SelectItem value="OUT">🔴 OUT — Exit</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="unitRef">Unit / Flat</Label>
                <Input
                  id="unitRef"
                  placeholder="e.g. A-101"
                  value={unitRef}
                  onChange={(e) => setUnitRef(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gate">Gate</Label>
                <Select value={gate} onValueChange={setGate}>
                  <SelectTrigger id="gate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GATES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  placeholder="e.g. Delivery, Family visit"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Logging..." : "Log Gate Event"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search name or unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={dirFilter} onValueChange={setDirFilter}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="IN">Entry (IN)</SelectItem>
            <SelectItem value="OUT">Exit (OUT)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Person type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {PERSON_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No gate logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="hidden sm:table-cell">Unit</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Vehicle
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Gate</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium">{l.person_name}</div>
                        {l.purpose && (
                          <div className="text-xs text-muted-foreground">
                            {l.purpose}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {l.person_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            l.direction === "IN"
                              ? "bg-green-500/20 text-green-600 border-green-500/30"
                              : "bg-red-500/20 text-red-600 border-red-500/30"
                          }
                        >
                          {l.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {l.unit_ref ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {l.vehicle_number ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {l.gate ?? "—"}
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
