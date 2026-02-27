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

type Bill = {
  id: number;
  unit_number: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  status: string;
  total_amount: string;
  balance_amount: string;
};

export function BillingClient() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [unitId, setUnitId] = useState("");
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/billing");
        if (!res.ok) {
          throw new Error("Failed to load bills");
        }
        const data = (await res.json()) as Bill[];
        setBills(data);
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

    if (!unitId || !billingPeriodStart || !billingPeriodEnd || !dueDate || !totalAmount) {
      setError("All fields are required");
      return;
    }

    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitId: Number(unitId),
        billingPeriodStart,
        billingPeriodEnd,
        dueDate,
        totalAmount: Number(totalAmount),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to create bill");
      return;
    }

    const refreshed = await fetch("/api/billing");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Bill[];
      setBills(data);
    }

    setUnitId("");
    setBillingPeriodStart("");
    setBillingPeriodEnd("");
    setDueDate("");
    setTotalAmount("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Create Bill</CardTitle>
          <CardDescription>
            Generate a maintenance or utility bill for a specific unit.
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
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingPeriodStart">Period start</Label>
                <Input
                  id="billingPeriodStart"
                  type="date"
                  value={billingPeriodStart}
                  onChange={(e) => setBillingPeriodStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingPeriodEnd">Period end</Label>
                <Input
                  id="billingPeriodEnd"
                  type="date"
                  value={billingPeriodEnd}
                  onChange={(e) => setBillingPeriodEnd(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total amount</Label>
              <Input
                id="totalAmount"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Create bill</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <CardDescription>
            Recently generated maintenance and utility bills.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading bills...</p>
          ) : bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bills found. Create the first bill using the form.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.unit_number}</TableCell>
                    <TableCell>
                      {bill.billing_period_start} &ndash; {bill.billing_period_end}
                    </TableCell>
                    <TableCell>{bill.due_date}</TableCell>
                    <TableCell>{bill.status}</TableCell>
                    <TableCell>{bill.total_amount}</TableCell>
                    <TableCell>{bill.balance_amount}</TableCell>
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

