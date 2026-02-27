"use client";

import { useEffect, useState, FormEvent } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

type Payment = {
  id: number;
  bill_id: number;
  unit_number: string;
  member_name: string | null;
  payment_date: string;
  amount: string;
  method: string;
  status: string;
  reference_number: string | null;
};

export function PaymentsClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [billId, setBillId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>("SUCCESS");
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/payments");
        if (!res.ok) {
          throw new Error("Failed to load payments");
        }
        const data = (await res.json()) as Payment[];
        setPayments(data);
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

    if (!billId || !amount || !method || !status) {
      setError("Bill ID, amount, method, and status are required");
      return;
    }

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billId: Number(billId),
        memberId: memberId ? Number(memberId) : null,
        amount: Number(amount),
        method,
        status,
        referenceNumber: referenceNumber || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to add payment");
      return;
    }

    const refreshed = await fetch("/api/payments");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Payment[];
      setPayments(data);
    }

    setBillId("");
    setMemberId("");
    setAmount("");
    setMethod(undefined);
    setStatus("SUCCESS");
    setReferenceNumber("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
          <CardDescription>
            Log a payment made against a generated bill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billId">Bill ID</Label>
                <Input
                  id="billId"
                  value={billId}
                  onChange={(e) => setBillId(e.target.value)}
                  required
                  placeholder="numeric ID from bills"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberId">Member ID (optional)</Label>
                <Input
                  id="memberId"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="numeric ID from members"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={(value) => setMethod(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="NET_BANKING">Net banking</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference number</Label>
                <Input
                  id="referenceNumber"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="gateway reference, cheque no, etc."
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Add payment</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            Payments received against maintenance and utility bills.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading payments...</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments found. Record the first payment using the form.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>#{p.bill_id}</TableCell>
                    <TableCell>{p.unit_number}</TableCell>
                    <TableCell>{p.member_name ?? "-"}</TableCell>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "SUCCESS"
                            ? "default"
                            : p.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.amount}</TableCell>
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

