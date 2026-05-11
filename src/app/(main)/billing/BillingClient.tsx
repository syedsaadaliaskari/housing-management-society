"use client";

import { Zap, Receipt, AlertCircle, CheckCircle2, Clock } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

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

type Unit = {
  id: number;
  unit_number: string;
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  PARTIALLY_PAID: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  OVERDUE: "bg-red-500/20 text-red-600 border-red-500/30",
  PAID: "bg-green-500/20 text-green-600 border-green-500/30",
  CANCELLED: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

const PAGE_SIZE = 10;

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

export function BillingClient() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filtered, setFiltered] = useState<Bill[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [unitId, setUnitId] = useState("");
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [autoMonth, setAutoMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [autoDueDays, setAutoDueDays] = useState("15");
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoResult, setAutoResult] = useState<{
    generated: number;
    skipped: number;
    billingPeriod: string;
    dueDate: string;
  } | null>(null);

  // ── derived stats ──
  const stats = {
    total: bills.length,
    paid: bills.filter((b) => b.status === "PAID").length,
    overdue: bills.filter((b) => b.status === "OVERDUE").length,
    pending: bills.filter((b) => b.status === "PENDING").length,
    outstanding: bills
      .filter((b) => b.status !== "PAID" && b.status !== "CANCELLED")
      .reduce((sum, b) => sum + Number(b.balance_amount), 0),
  };

  // ── pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAutoGenerate = async () => {
    setAutoRunning(true);
    setAutoResult(null);
    try {
      const res = await fetch("/api/billing/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingMonth: autoMonth,
          dueDays: Number(autoDueDays),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Auto-generation failed");
        return;
      }
      const data = await res.json();
      setAutoResult(data);
      toast.success(
        `Generated ${data.generated} bills, skipped ${data.skipped}`,
      );
      await load();
    } finally {
      setAutoRunning(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [billsRes, unitsRes] = await Promise.all([
        fetch("/api/billing"),
        fetch("/api/units"),
      ]);
      if (billsRes.ok) {
        const data = (await billsRes.json()) as Bill[];
        setBills(data);
        setFiltered(data);
      }
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch {
      toast.error("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = bills;
    if (statusFilter !== "ALL") {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.unit_number.toLowerCase().includes(q));
    }
    setFiltered(result);
    setPage(1);
  }, [search, statusFilter, bills]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!unitId) {
      toast.error("Please select a unit.");
      return;
    }
    setSubmitting(true);
    try {
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
        toast.error(body?.error ?? "Failed to create bill.");
        return;
      }

      toast.success("Bill created successfully.");
      const refreshed = await fetch("/api/billing");
      if (refreshed.ok) {
        const data = (await refreshed.json()) as Bill[];
        setBills(data);
        setFiltered(data);
      }

      setUnitId("");
      setBillingPeriodStart("");
      setBillingPeriodEnd("");
      setDueDate("");
      setTotalAmount("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP ROW: Auto Scheduler + Create Bill ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Auto Scheduler */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="size-4 text-amber-500" /> Auto Billing Scheduler
            </CardTitle>
            <CardDescription>
              Automatically generate monthly bills for all active units based on
              their default maintenance and utility charges.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="autoMonth">Billing Month</Label>
                <Input
                  id="autoMonth"
                  type="month"
                  value={autoMonth}
                  onChange={(e) => setAutoMonth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDays">Due on day of month</Label>
                <Input
                  id="dueDays"
                  type="number"
                  min={1}
                  max={28}
                  value={autoDueDays}
                  onChange={(e) => setAutoDueDays(e.target.value)}
                />
              </div>
            </div>

            {autoResult && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p>
                  <span className="font-medium text-green-600">
                    ✓ {autoResult.generated} bills generated
                  </span>
                  {autoResult.skipped > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {autoResult.skipped} skipped (already exist or zero
                      amount)
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground">
                  Period: {autoResult.billingPeriod} · Due: {autoResult.dueDate}
                </p>
              </div>
            )}

            <Button
              onClick={handleAutoGenerate}
              disabled={autoRunning}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {autoRunning ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  Generating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="size-4" /> Generate Bills for Month
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Create Bill */}
        <Card>
          <CardHeader>
            <CardTitle>Create Bill</CardTitle>
            <CardDescription>
              Generate a maintenance or utility bill for a unit.
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total amount (Rs)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                    placeholder="e.g. 5000"
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
                    Creating...
                  </span>
                ) : (
                  "Create bill"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── STATS ROW ── */}
      {!loading && bills.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Receipt className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Bills</p>
              <p className="text-xl font-semibold">{stats.total}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="size-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-xl font-semibold">{stats.paid}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="size-9 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Clock className="size-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-semibold">{stats.pending}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="size-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="size-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-lg font-semibold">
                Rs {stats.outstanding.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── BILLS TABLE — full width ── */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Bills List</CardTitle>
          <CardDescription>
            All generated maintenance and utility bills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by unit number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} bill{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-40 hidden sm:block" />
                  <Skeleton className="h-4 w-24 hidden md:block" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <div className="size-14 rounded-full bg-muted flex items-center justify-center text-3xl">
                🧾
              </div>
              <p className="font-medium text-sm">No bills found</p>
              <p className="text-xs text-muted-foreground">
                {statusFilter !== "ALL"
                  ? "Try changing the status filter."
                  : "Create your first bill using the form above."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-25">Unit</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Period
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Due Date
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((bill) => (
                      <TableRow
                        key={bill.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-semibold">
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
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                              statusColor[bill.status] ?? ""
                            }`}
                          >
                            {bill.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(bill.total_amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {formatAmount(bill.balance_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                    {filtered.length} bills
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - page) <= 1,
                        )
                        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                            acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) =>
                          p === "..." ? (
                            <span
                              key={`ellipsis-${i}`}
                              className="text-muted-foreground text-sm px-1"
                            >
                              …
                            </span>
                          ) : (
                            <Button
                              key={p}
                              variant={page === p ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setPage(p as number)}
                            >
                              {p}
                            </Button>
                          ),
                        )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
