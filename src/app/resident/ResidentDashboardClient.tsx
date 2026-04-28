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
import { Textarea } from "@/components/ui/textarea";
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

type Summary = {
  outstanding: string;
  lastPaymentAt: string | null;
  openComplaints: number;
  activeAlerts: number;
};

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

type ResidentComplaint = {
  id: number;
  unit_number: string | null;
  category_name: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
};

type ResidentPoll = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  start_at: string | null;
  end_at: string | null;
  options: {
    id: number;
    poll_id: number;
    option_text: string;
    sort_order: number;
  }[];
  has_voted: boolean;
};

type ResidentSos = {
  id: number;
  unit_number: string | null;
  alert_type: string;
  message: string | null;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
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
    case "RESOLVED":
    case "CLOSED":
    case "SUCCESS":
      return "default";
    case "IN_PROGRESS":
    case "PARTIALLY_PAID":
    case "ACKNOWLEDGED":
      return "secondary";
    case "OVERDUE":
    case "ACTIVE":
    case "FAILED":
      return "destructive";
    default:
      return "outline";
  }
}

function priorityVariant(priority: string) {
  switch (priority) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "secondary";
    default:
      return "outline";
  }
}

export function ResidentDashboardClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [bills, setBills] = useState<ResidentBill[]>([]);
  const [payments, setPayments] = useState<ResidentPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<ResidentPayment[]>(
    [],
  );
  const [complaints, setComplaints] = useState<ResidentComplaint[]>([]);
  const [polls, setPolls] = useState<ResidentPoll[]>([]);
  const [alerts, setAlerts] = useState<ResidentSos[]>([]);
  const [loading, setLoading] = useState(true);

  // complaint form
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // sos form
  const [alertType, setAlertType] = useState("MEDICAL");
  const [sosMessage, setSosMessage] = useState("");
  const [submittingSos, setSubmittingSos] = useState(false);

  // pay now
  const [payingBillId, setPayingBillId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState("CASH");

  // payment filter
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [
          summaryRes,
          billsRes,
          paymentsRes,
          complaintsRes,
          pollsRes,
          alertsRes,
        ] = await Promise.all([
          fetch("/api/resident/summary"),
          fetch("/api/resident/bills"),
          fetch("/api/resident/payments"),
          fetch("/api/resident/complaints"),
          fetch("/api/resident/polls"),
          fetch("/api/resident/sos"),
        ]);

        if (summaryRes.ok) setSummary(await summaryRes.json());
        if (billsRes.ok) setBills(await billsRes.json());
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data);
          setFilteredPayments(data);
        }
        if (complaintsRes.ok) setComplaints(await complaintsRes.json());
        if (pollsRes.ok) setPolls(await pollsRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
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

      const [summaryRes, billsRes, paymentsRes] = await Promise.all([
        fetch("/api/resident/summary"),
        fetch("/api/resident/bills"),
        fetch("/api/resident/payments"),
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
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

  const handleSubmitComplaint = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingComplaint(true);
    try {
      const res = await fetch("/api/resident/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, priority }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to submit complaint");
        return;
      }

      toast.success("Complaint submitted successfully");
      setSubject("");
      setDescription("");
      setPriority("MEDIUM");

      const refreshed = await fetch("/api/resident/complaints");
      if (refreshed.ok) setComplaints(await refreshed.json());
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleSubmitSos = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingSos(true);
    try {
      const res = await fetch("/api/resident/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertType, message: sosMessage || null }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to trigger SOS");
        return;
      }

      toast.success("SOS alert triggered. Help is on the way!");
      setSosMessage("");
      setAlertType("MEDICAL");

      const refreshed = await fetch("/api/resident/sos");
      if (refreshed.ok) setAlerts(await refreshed.json());

      const summaryRes = await fetch("/api/resident/summary");
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } finally {
      setSubmittingSos(false);
    }
  };

  const handleVote = async (pollId: number, optionId: number) => {
    const res = await fetch("/api/resident/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId, optionId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "Failed to submit vote");
      return;
    }

    toast.success("Vote submitted!");
    const refreshed = await fetch("/api/resident/polls");
    if (refreshed.ok) setPolls(await refreshed.json());
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pendingBills = bills.filter((b) =>
    ["PENDING", "OVERDUE", "PARTIALLY_PAID"].includes(b.status),
  );

  return (
    <div className="space-y-6 pb-10">
      {summary && (
        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding dues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {formatAmount(summary.outstanding)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {formatDate(summary.lastPaymentAt)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{summary.openComplaints}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{summary.activeAlerts}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Bills</CardTitle>
          <CardDescription>
            Outstanding maintenance and utility bills.
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
                        Due date
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount due</TableHead>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit complaint</CardTitle>
            <CardDescription>
              Raise an issue related to maintenance, security, or amenities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="e.g. Water leakage in corridor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Briefly describe the issue in detail"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={submittingComplaint}
              >
                {submittingComplaint ? "Submitting..." : "Submit complaint"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My complaints</CardTitle>
            <CardDescription>
              Track the status of complaints you have raised.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No complaints submitted yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Priority
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="max-w-35 truncate">
                          {c.subject}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(c.status)}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={priorityVariant(c.priority)}>
                            {c.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {formatDate(c.created_at)}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">
              Trigger SOS alert
            </CardTitle>
            <CardDescription>
              Use for emergencies only. Admin and security will be notified
              immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitSos} className="space-y-4">
              <div className="space-y-2">
                <Label>Alert type</Label>
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEDICAL">Medical</SelectItem>
                    <SelectItem value="FIRE">Fire</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sosMessage">Message (optional)</Label>
                <Input
                  id="sosMessage"
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  placeholder="Short description of the emergency"
                />
              </div>
              <Button
                type="submit"
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={submittingSos}
              >
                {submittingSos ? "Sending..." : "Trigger SOS"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My alerts</CardTitle>
            <CardDescription>
              Emergency alerts you have raised and their current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No emergency alerts raised.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Resolved
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          {a.alert_type}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(a.status)}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {formatDate(a.created_at)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {formatDate(a.resolved_at)}
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

      <Card>
        <CardHeader>
          <CardTitle>Active polls</CardTitle>
          <CardDescription>
            Cast your vote in ongoing society polls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {polls.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active polls at the moment.
            </p>
          ) : (
            <div className="space-y-4">
              {polls.map((p) => (
                <div key={p.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={p.status === "OPEN" ? "default" : "outline"}
                    >
                      {p.status}
                    </Badge>
                  </div>
                  {p.has_voted || p.status !== "OPEN" ? (
                    <p className="text-xs text-muted-foreground">
                      {p.status !== "OPEN"
                        ? "This poll is closed."
                        : "You have already voted in this poll."}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {p.options.map((o) => (
                        <Button
                          key={o.id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleVote(p.id, o.id)}
                        >
                          {o.option_text}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Recent payments</CardTitle>
              <CardDescription>
                Your latest maintenance and utility payments.
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
