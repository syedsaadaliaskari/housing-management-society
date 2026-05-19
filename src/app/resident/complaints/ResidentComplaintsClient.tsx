"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ResidentComplaintsClient() {
  const [complaints, setComplaints] = useState<ResidentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintPriority, setComplaintPriority] = useState<string>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  const loadComplaints = useCallback(async () => {
    try {
      const res = await fetch("/api/resident/complaints");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to load complaints");
      }
      const data = (await res.json()) as ResidentComplaint[];
      setComplaints(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();

    // Connect to the existing SSE notification stream.
    // When admin updates this resident's complaint status,
    // a COMPLAINT notification fires — we re-fetch to show the new status live.
    const es = new EventSource("/api/notifications/stream");

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "COMPLAINT") {
        loadComplaints();
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [loadComplaints]);

  const handleSubmitComplaint = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!complaintSubject || !complaintDescription || !complaintPriority) {
      setError("Subject, description, and priority are required");
      return;
    }

    setSubmitting(true);
    try {
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

      await loadComplaints();
      setComplaintSubject("");
      setComplaintDescription("");
      setComplaintPriority("MEDIUM");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Submit Complaint / Suggestion</CardTitle>
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
                placeholder="e.g. Water leakage in corridor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaintDescription">Description</Label>
              <Textarea
                id="complaintDescription"
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                required
                placeholder="Briefly describe the issue or suggestion"
                rows={4}
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>My Complaints & Suggestions</CardTitle>
          <CardDescription>
            Status updates appear here automatically — no need to refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have not submitted any complaints yet.
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
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-48 truncate">
                        {c.subject}
                      </TableCell>
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
                      <TableCell className="hidden sm:table-cell">
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
  );
}
