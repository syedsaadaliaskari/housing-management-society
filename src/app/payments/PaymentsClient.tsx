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
import { Skeleton } from "@/components/ui/skeleton";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [billId, setBillId] = useState("");
  const [memberId, setMemberId] = useState("NONE");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("SUCCESS");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
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
    } catch {
      toast.error("Failed to load payments data");
    } finally {
      setLoading(false);
    }
  }

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

  const handleBillSelect = (value: string) => {
    setBillId(value);
    const bill = bills.find((b) => String(b.id) === value);
    if (bill) setAmount(bill.balance_amount);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!billId) {
      toast.error("Please select a bill.");
      return;
    }
    if (!method) {
      toast.error("Please select a payment method.");
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
        toast.error(body?.error ?? "Failed to record payment.");
        return;
      }

      toast.success("Payment recorded successfully.");

      const [refreshedPayments, refreshedBills] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/bills-list"),
      ]);
      if (refreshedPayments.ok) {
        const data = (await refreshedPayments.json()) as Payment[];
        setPayments(data);
        setFiltered(data);
      }
      if (refreshedBills.ok) setBills(await refreshedBills.json());

      setBillId("");
      setMemberId("NONE");
      setAmount("");
      setMethod("");
      setStatus("SUCCESS");
      setReferenceNumber("");
    } finally {
      setSubmitting(false);
    }
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

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            All payments received against bills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32 hidden sm:block" />
                  <Skeleton className="h-4 w-24 hidden md:block" />
                  <Skeleton className="h-4 w-16 hidden sm:block" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                💳
              </div>
              <p className="font-medium text-sm">No payments found</p>
              <p className="text-xs text-muted-foreground">
                Record your first payment using the form.
              </p>
            </div>
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
