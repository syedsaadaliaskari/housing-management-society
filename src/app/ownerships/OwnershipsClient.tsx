"use client";

import { useEffect, useState, FormEvent } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

type Ownership = {
  id: number;
  unit_number: string;
  owner_name: string;
  from_date: string;
  to_date: string | null;
  purchase_price: string | null;
  sale_price: string | null;
};

export function OwnershipsClient() {
  const [rows, setRows] = useState<Ownership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [unitId, setUnitId] = useState("");
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/ownerships");
        if (!res.ok) {
          throw new Error("Failed to load ownerships");
        }
        const data = (await res.json()) as Ownership[];
        setRows(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!unitId || !ownerMemberId || !fromDate) {
      setError("Unit ID, owner member ID, and from date are required");
      return;
    }

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
      setError(body?.error ?? "Failed to add ownership record");
      return;
    }

    const refreshed = await fetch("/api/ownerships");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Ownership[];
      setRows(data);
    }

    setUnitId("");
    setOwnerMemberId("");
    setFromDate("");
    setToDate("");
    setPurchasePrice("");
    setSalePrice("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Add Ownership Record</CardTitle>
          <CardDescription>
            Record transfers of ownership for a specific unit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitId">Unit ID</Label>
                <Input
                  id="unitId"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  required
                  placeholder="numeric ID from units"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerMemberId">Owner member ID</Label>
                <Input
                  id="ownerMemberId"
                  value={ownerMemberId}
                  onChange={(e) => setOwnerMemberId(e.target.value)}
                  required
                  placeholder="numeric ID from members"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromDate">From date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">To date (optional)</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale price</Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Add ownership</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Ownership History</CardTitle>
          <CardDescription>
            Historical ownership records for units.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading ownership history...
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ownership records found yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Sale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.unit_number}</TableCell>
                    <TableCell>{row.owner_name}</TableCell>
                    <TableCell>{row.from_date}</TableCell>
                    <TableCell>{row.to_date ?? "-"}</TableCell>
                    <TableCell>{row.purchase_price ?? "-"}</TableCell>
                    <TableCell>{row.sale_price ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

