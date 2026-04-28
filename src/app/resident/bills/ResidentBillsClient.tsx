"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type ResidentBill = {
  id: number;
  unit_number: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  status: string;
  total_amount: string;
  balance_amount: string;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: string) {
  return `₨ ${Number(amount).toLocaleString()}`;
}

function statusVariant(status: string) {
  switch (status) {
    case "PAID":
      return "default";
    case "PARTIALLY_PAID":
      return "secondary";
    case "OVERDUE":
      return "destructive";
    default:
      return "outline";
  }
}

export default function ResidentBillsClient() {
  const [bills, setBills] = useState<ResidentBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<ResidentBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBillId, setPayingBillId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState("CASH");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/resident/bills");
        if (res.ok) {
          const data = await res.json();
          setBills(data);
          setFilteredBills(data);
        }
      } catch {
        toast.error("Failed to load bills");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (statusFilter === "ALL") {
      setFilteredBills(bills);
    } else {
      setFilteredBills(bills.filter((b) => b.status === statusFilter));
    }
  }, [statusFilter, bills]);

  const handlePayNow = async (bill: ResidentBill) => {
    setPayingBillId(bill.id);
    try {
      const res = await fetch("/api/resident/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: bill.id,
          amount: Number(bill.balance_amount),
          method: payMethod,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Payment failed");
        return;
      }

      const data = await res.json();
      toast.success(`Payment successful! Ref: ${data.reference_number}`);

      const refreshed = await fetch("/api/resident/bills");
      if (refreshed.ok) {
        const data = await refreshed.json();
        setBills(data);
        setFilteredBills(
          statusFilter === "ALL"
            ? data
            : data.filter((b: ResidentBill) => b.status === statusFilter),
        );
      }
    } finally {
      setPayingBillId(null);
    }
  };

  const pendingCount = bills.filter((b) =>
    ["PENDING", "OVERDUE", "PARTIALLY_PAID"].includes(b.status),
  ).length;

  const totalOutstanding = bills
    .filter((b) => ["PENDING", "OVERDUE", "PARTIALLY_PAID"].includes(b.status))
    .reduce((sum, b) => sum + Number(b.balance_amount), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-40 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Unpaid / overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              ₨ {totalOutstanding.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across all pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>All Bills</CardTitle>
              <CardDescription>
                Complete history of your maintenance and utility bills.
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredBills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bills found.</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-2">
                <Label className="text-sm shrink-0">Pay via</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Period
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Due Date
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.map((bill) => {
                      const isPending = [
                        "PENDING",
                        "OVERDUE",
                        "PARTIALLY_PAID",
                      ].includes(bill.status);
                      return (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">
                            {bill.unit_number}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                            {formatDate(bill.billing_period_start)} —{" "}
                            {formatDate(bill.billing_period_end)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs">
                            {formatDate(bill.due_date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(bill.status)}>
                              {bill.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatAmount(bill.total_amount)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatAmount(bill.balance_amount)}
                          </TableCell>
                          <TableCell>
                            {isPending ? (
                              <Button
                                size="sm"
                                disabled={payingBillId === bill.id}
                                onClick={() => handlePayNow(bill)}
                              >
                                {payingBillId === bill.id
                                  ? "Processing..."
                                  : "Pay Now"}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
