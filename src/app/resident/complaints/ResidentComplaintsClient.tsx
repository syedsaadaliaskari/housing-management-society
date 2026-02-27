"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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

export function ResidentComplaintsClient() {
  const [complaints, setComplaints] = useState<ResidentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintPriority, setComplaintPriority] = useState<string | undefined>(
    "MEDIUM",
  );

  useEffect(() => {
    const load = async () => {
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
    };

    load();
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaintDescription">Description</Label>
              <Input
                id="complaintDescription"
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                required
                placeholder="Briefly describe the issue or suggestion"
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
            <Button type="submit">Submit</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>My Complaints & Suggestions</CardTitle>
          <CardDescription>
            Track the status of requests you have raised.
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
  );
}

