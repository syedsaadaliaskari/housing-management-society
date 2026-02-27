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

export function ResidentDashboardClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [payments, setPayments] = useState<ResidentPayment[]>([]);
  const [complaints, setComplaints] = useState<ResidentComplaint[]>([]);
  const [polls, setPolls] = useState<ResidentPoll[]>([]);
  const [alerts, setAlerts] = useState<ResidentSos[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // complaint form
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintPriority, setComplaintPriority] = useState<string | undefined>(
    "MEDIUM",
  );

  // SOS form
  const [sosAlertType, setSosAlertType] = useState<string | undefined>("MEDICAL");
  const [sosMessage, setSosMessage] = useState("");

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [summaryRes, paymentsRes, complaintsRes, pollsRes, alertsRes] =
          await Promise.all([
            fetch("/api/resident/summary"),
            fetch("/api/resident/payments"),
            fetch("/api/resident/complaints"),
            fetch("/api/resident/polls"),
            fetch("/api/resident/sos"),
          ]);

        if (!summaryRes.ok) throw new Error("Failed to load summary");
        if (!paymentsRes.ok) throw new Error("Failed to load payments");
        if (!complaintsRes.ok) throw new Error("Failed to load complaints");
        if (!pollsRes.ok) throw new Error("Failed to load polls");
        if (!alertsRes.ok) throw new Error("Failed to load alerts");

        const summaryData = (await summaryRes.json()) as Summary;
        const paymentsData = (await paymentsRes.json()) as ResidentPayment[];
        const complaintsData = (await complaintsRes.json()) as ResidentComplaint[];
        const pollsData = (await pollsRes.json()) as ResidentPoll[];
        const alertsData = (await alertsRes.json()) as ResidentSos[];

        setSummary(summaryData);
        setPayments(paymentsData);
        setComplaints(complaintsData);
        setPolls(pollsData);
        setAlerts(alertsData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const handleSubmitComplaint = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!complaintSubject || !complaintDescription || !complaintPriority) {
      setError("Subject, description, and priority are required");
      return;
    }

    const res = await fetch("/api/resident/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: complaintSubject,
        description: complaintDescription,
        priority: complaintPriority,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to submit complaint");
      return;
    }

    const refreshed = await fetch("/api/resident/complaints");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as ResidentComplaint[];
      setComplaints(data);
    }

    setComplaintSubject("");
    setComplaintDescription("");
    setComplaintPriority("MEDIUM");
  };

  const handleSubmitSos = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!sosAlertType) {
      setError("Alert type is required");
      return;
    }

    const res = await fetch("/api/resident/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertType: sosAlertType,
        message: sosMessage || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to trigger alert");
      return;
    }

    const refreshed = await fetch("/api/resident/sos");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as ResidentSos[];
      setAlerts(data);
    }

    setSosAlertType("MEDICAL");
    setSosMessage("");
  };

  const handleVote = async (pollId: number, optionId: number) => {
    setError(null);

    const res = await fetch("/api/resident/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId, optionId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to submit vote");
      return;
    }

    const refreshed = await fetch("/api/resident/polls");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as ResidentPoll[];
      setPolls(data);
    }
  };

  if (loading && !summary) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading your dashboard...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding dues</CardTitle>
              <CardDescription>
                Total unpaid maintenance and utility charges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                ₹ {Number(summary.outstanding).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Last payment</CardTitle>
              <CardDescription>
                Most recent successful payment date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {summary.lastPaymentAt ?? "No payments yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Open complaints</CardTitle>
              <CardDescription>
                Complaints currently open or in progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {summary.openComplaints}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active alerts</CardTitle>
              <CardDescription>
                Emergency alerts awaiting resolution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {summary.activeAlerts}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Submit Complaint / Request</CardTitle>
            <CardDescription>
              Raise an issue related to maintenance, security, or amenities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="complaintSubject">Subject</Label>
                <Input
                  id="complaintSubject"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complaintDescription">Description</Label>
                <Input
                  id="complaintDescription"
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  required
                  placeholder="Briefly describe the issue"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={complaintPriority}
                  onValueChange={(value) => setComplaintPriority(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Submit complaint</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>My Complaints</CardTitle>
            <CardDescription>
              Recently submitted complaints and requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have not submitted any complaints yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.subject}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.status === "RESOLVED" || c.status === "CLOSED"
                              ? "default"
                              : c.status === "IN_PROGRESS"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.priority === "URGENT"
                              ? "destructive"
                              : c.priority === "HIGH"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {c.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Trigger SOS Alert</CardTitle>
            <CardDescription>
              Use for emergencies only. Alerts will be visible to security/admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitSos} className="space-y-4">
              <div className="space-y-2">
                <Label>Alert type</Label>
                <Select
                  value={sosAlertType}
                  onValueChange={(value) => setSosAlertType(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
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
              <Button type="submit" variant="destructive">
                Trigger SOS
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>My Alerts</CardTitle>
            <CardDescription>
              Emergency alerts you have raised and their status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have not raised any emergency alerts.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Resolved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.alert_type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "ACTIVE"
                              ? "destructive"
                              : a.status === "ACKNOWLEDGED"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.created_at}</TableCell>
                      <TableCell>{a.resolved_at ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Active Polls</CardTitle>
          <CardDescription>
            Cast your vote in ongoing society polls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {polls.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              There are no active polls at the moment.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polls.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "OPEN"
                            ? "default"
                            : p.status === "DRAFT"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.options.length === 0
                        ? "-"
                        : p.options.map((o) => o.option_text).join(", ")}
                    </TableCell>
                    <TableCell>
                      {p.has_voted || p.status !== "OPEN" ? (
                        <span className="text-xs text-muted-foreground">
                          {p.status !== "OPEN"
                            ? "Poll closed"
                            : "You have already voted"}
                        </span>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Your latest maintenance and utility payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill</TableHead>
                  <TableHead>Unit</TableHead>
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

