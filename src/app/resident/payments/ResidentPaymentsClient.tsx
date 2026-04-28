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

type ResidentPayment = {
  id: number;
  bill_id: number;
  unit_number: string;
  payment_date: string;
  amount: string;
  method: string;
  status: string;
  reference_number: string | null;
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
    case "SUCCESS":
      return "default";
    case "PARTIALLY_PAID":
      return "secondary";
    case "OVERDUE":
    case "FAILED":
      return "destructive";
    default:
      return "outline";
  }
}

export default function ResidentPaymentsClient() {
  const [bills, setBills] = useState<ResidentBill[]>([]);
  const [payments, setPayments] = useState<ResidentPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<ResidentPayment[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [payingBillId, setPayingBillId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState("CASH");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        const [billsRes, paymentsRes] = await Promise.all([
          fetch("/api/resident/bills"),
          fetch("/api/resident/payments"),
        ]);
        if (billsRes.ok) setBills(await billsRes.json());
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data);
          setFilteredPayments(data);
        }
      } catch {
        toast.error("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (paymentFilter === "ALL") {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter((p) => p.status === paymentFilter));
    }
  }, [paymentFilter, payments]);

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

      const [billsRes, paymentsRes] = await Promise.all([
        fetch("/api/resident/bills"),
        fetch("/api/resident/payments"),
      ]);
      if (billsRes.ok) setBills(await billsRes.json());
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data);
        setFilteredPayments(data);
      }
    } finally {
      setPayingBillId(null);
    }
  };

  const pendingBills = bills.filter((b) =>
    ["PENDING", "OVERDUE", "PARTIALLY_PAID"].includes(b.status),
  );

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Outstanding Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Bills</CardTitle>
          <CardDescription>
            Pending and overdue bills that require payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingBills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No outstanding bills. You are all clear! ✅
            </p>
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
                      <TableHead>Amount Due</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBills.map((bill) => (
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
                        <TableCell className="font-medium">
                          {formatAmount(bill.balance_amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            disabled={payingBillId === bill.id}
                            onClick={() => handlePayNow(bill)}
                          >
                            {payingBillId === bill.id
                              ? "Processing..."
                              : "Pay Now"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All your past maintenance and utility payments.
              </CardDescription>
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Method
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Reference
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.unit_number}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(p.payment_date)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {p.method}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {p.reference_number ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(p.status)}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(p.amount)}
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
