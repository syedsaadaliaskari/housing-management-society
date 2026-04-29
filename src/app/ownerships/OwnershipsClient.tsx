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
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";

type Ownership = {
  id: number;
  unit_number: string;
  owner_name: string;
  from_date: string;
  to_date: string | null;
  purchase_price: string | null;
  sale_price: string | null;
};

type Member = {
  id: number;
  first_name: string;
  last_name: string | null;
};

type Unit = {
  id: number;
  unit_number: string;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: string | null) {
  if (!amount) return "—";
  return `Rs ${Number(amount).toLocaleString()}`;
}

export function OwnershipsClient() {
  const [rows, setRows] = useState<Ownership[]>([]);
  const [filtered, setFiltered] = useState<Ownership[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const [unitId, setUnitId] = useState<string | undefined>();
  const [ownerMemberId, setOwnerMemberId] = useState<string | undefined>();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [ownershipsRes, membersRes, unitsRes] = await Promise.all([
        fetch("/api/ownerships"),
        fetch("/api/members"),
        fetch("/api/units"),
      ]);
      if (ownershipsRes.ok) {
        const data = (await ownershipsRes.json()) as Ownership[];
        setRows(data);
        setFiltered(data);
      }
      if (membersRes.ok) setMembers(await membersRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch {
      toast.error("Failed to load ownership data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = rows;
    if (activeFilter === "ACTIVE") {
      result = result.filter((r) => !r.to_date);
    } else if (activeFilter === "PAST") {
      result = result.filter((r) => !!r.to_date);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.unit_number.toLowerCase().includes(q) ||
          r.owner_name.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [search, activeFilter, rows]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!unitId) {
      toast.error("Please select a unit.");
      return;
    }
    if (!ownerMemberId) {
      toast.error("Please select an owner member.");
      return;
    }
    if (!fromDate) {
      toast.error("From date is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/ownerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: Number(unitId),
          ownerMemberId: Number(ownerMemberId),
          fromDate,
          toDate: toDate || null,
          purchasePrice: purchasePrice ? Number(purchasePrice) : null,
          salePrice: salePrice ? Number(salePrice) : null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to add ownership record.");
        return;
      }

      toast.success("Ownership record added successfully.");
      await load();
      setUnitId(undefined);
      setOwnerMemberId(undefined);
      setFromDate("");
      setToDate("");
      setPurchasePrice("");
      setSalePrice("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* ADD OWNERSHIP FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Add Ownership Record</CardTitle>
          <CardDescription>
            Record transfers of ownership for a specific unit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {units.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No units found. Add units first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Owner member</Label>
              <Select value={ownerMemberId} onValueChange={setOwnerMemberId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.first_name} {m.last_name ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No members found. Add members first.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From date</Label>
                <DatePicker
                  value={fromDate}
                  onChange={setFromDate}
                  placeholder="Select from date"
                />
              </div>
              <div className="space-y-2">
                <Label>To date (optional)</Label>
                <DatePicker
                  value={toDate}
                  onChange={setToDate}
                  placeholder="Select to date"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase price (Rs)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale price (Rs)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                "Add ownership"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* OWNERSHIP TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Ownership History</CardTitle>
          <CardDescription>
            Historical and current ownership records for all units.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by unit or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAST">Past</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24 hidden sm:block" />
                  <Skeleton className="h-4 w-24 hidden sm:block" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                🏠
              </div>
              <p className="font-medium text-sm">No ownership records found</p>
              <p className="text-xs text-muted-foreground">
                Add your first ownership record using the form.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="hidden sm:table-cell">From</TableHead>
                    <TableHead className="hidden sm:table-cell">To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Purchase
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Sale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.unit_number}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.owner_name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {formatDate(row.from_date)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {formatDate(row.to_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={!row.to_date ? "default" : "secondary"}>
                          {!row.to_date ? "Active" : "Past"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatAmount(row.purchase_price)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatAmount(row.sale_price)}
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
