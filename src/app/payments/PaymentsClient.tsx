"use client";

import { useEffect, useState, FormEvent } from "react";
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

type BillListItem = {
  id: number;
  unit_number: string;
  due_date: string;
  balance_amount: string;
  status: string;
};

type Member = {
  id: number;
  first_name: string;
  last_name: string | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: string) {
  return `Rs ${Number(amount).toLocaleString()}`;
}

const statusColor: Record<string, string> = {
  SUCCESS: "bg-green-500/20 text-green-600 border-green-500/30",
  PENDING: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  FAILED: "bg-red-500/20 text-red-600 border-red-500/30",
};

export function PaymentsClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filtered, setFiltered] = useState<Payment[]>([]);
  const [bills, setBills] = useState<BillListItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [billId, setBillId] = useState<string | undefined>();
  const [memberId, setMemberId] = useState<string>("NONE");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string | undefined>();
  const [status, setStatus] = useState<string>("SUCCESS");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [paymentsRes, billsRes, membersRes] = await Promise.all([
          fetch("/api/payments"),
          fetch("/api/bills-list"),
          fetch("/api/members"),
        ]);
        if (paymentsRes.ok) {
          const data = (await paymentsRes.json()) as Payment[];
          setPayments(data);
          setFiltered(data);
        }
        if (billsRes.ok) setBills(await billsRes.json());
        if (membersRes.ok) setMembers(await membersRes.json());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let result = payments;
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.unit_number.toLowerCase().includes(q) ||
          (p.member_name ?? "").toLowerCase().includes(q) ||
          (p.reference_number ?? "").toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [search, statusFilter, payments]);

  // Auto fill amount when bill is selected
  const handleBillSelect = (value: string) => {
    setBillId(value);
    const bill = bills.find((b) => String(b.id) === value);
    if (bill) setAmount(bill.balance_amount);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (!billId) {
      setFormError("Please select a bill.");
      return;
    }
    if (!method) {
      setFormError("Please select a payment method.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: Number(billId),
          memberId: memberId !== "NONE" ? Number(memberId) : null,
          amount: Number(amount),
          method,
          status,
          referenceNumber: referenceNumber || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setFormError(body?.error ?? "Failed to record payment.");
        return;
      }

      const refreshed = await fetch("/api/payments");
      if (refreshed.ok) {
        const data = (await refreshed.json()) as Payment[];
        setPayments(data);
        setFiltered(data);
      }

      // Refresh bills list too
      const billsRefreshed = await fetch("/api/bills-list");
      if (billsRefreshed.ok) setBills(await billsRefreshed.json());

      setBillId(undefined);
      setMemberId("NONE");
      setAmount("");
      setMethod(undefined);
      setStatus("SUCCESS");
      setReferenceNumber("");
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* RECORD PAYMENT FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
          <CardDescription>
            Log a payment made against a generated bill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* BILL DROPDOWN */}
            <div className="space-y-2">
              <Label>Bill</Label>
              <Select value={billId} onValueChange={handleBillSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select bill" />
                </SelectTrigger>
                <SelectContent>
                  {bills.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      #{b.id} — {b.unit_number} — Rs{" "}
                      {Number(b.balance_amount).toLocaleString()} due{" "}
                      {formatDate(b.due_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bills.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No outstanding bills found.
                </p>
              )}
            </div>

            {/* MEMBER DROPDOWN */}
            <div className="space-y-2">
              <Label>Member (optional)</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No member</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.first_name} {m.last_name ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* AMOUNT — auto filled from bill */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (Rs)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="e.g. 5000"
                />
              </div>

              {/* METHOD */}
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* STATUS */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* REFERENCE */}
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference no.</Label>
                <Input
                  id="referenceNumber"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Cheque no, ref ID..."
                />
              </div>
            </div>

            {/* ERROR */}
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <span>⚠</span>
                <span>{formError}</span>
              </div>
            )}

            {/* SUCCESS */}
            {formSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <span>✓</span>
                <span>Payment recorded successfully.</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Recording...
                </span>
              ) : (
                "Record payment"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* PAYMENTS TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            All payments received against bills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by unit, member or ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} payment{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* TABLE */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading payments...</p>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Member
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Method
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.unit_number}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {p.member_name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(p.payment_date)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {p.method}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            statusColor[p.status] ?? ""
                          }`}
                        >
                          {p.status}
                        </span>
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
