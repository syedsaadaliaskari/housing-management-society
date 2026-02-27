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

type Complaint = {
  id: number;
  member_name: string | null;
  unit_number: string | null;
  category_name: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

export function ComplaintsClient() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string | undefined>("MEDIUM");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/complaints");
        if (!res.ok) {
          throw new Error("Failed to load complaints");
        }
        const data = (await res.json()) as Complaint[];
        setComplaints(data);
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

    if (!memberId || !subject || !description || !priority) {
      setError("Member, subject, description, and priority are required");
      return;
    }

    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: Number(memberId),
        unitId: unitId ? Number(unitId) : null,
        categoryId: categoryId ? Number(categoryId) : null,
        subject,
        description,
        priority,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to log complaint");
      return;
    }

    const refreshed = await fetch("/api/complaints");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Complaint[];
      setComplaints(data);
    }

    setMemberId("");
    setUnitId("");
    setCategoryId("");
    setSubject("");
    setDescription("");
    setPriority("MEDIUM");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Log Complaint / Request</CardTitle>
          <CardDescription>
            Capture issues and service requests raised by residents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberId">Member ID</Label>
                <Input
                  id="memberId"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  required
                  placeholder="numeric ID from members"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitId">Unit ID (optional)</Label>
                <Input
                  id="unitId"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  placeholder="numeric ID from units"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category ID (optional)</Label>
                <Input
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder="numeric ID from complaint_categories"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Short summary of the issue"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value)}
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
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Log complaint</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Complaints &amp; Requests</CardTitle>
          <CardDescription>
            Latest complaints with their status and priority.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading complaints...</p>
          ) : complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No complaints logged yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.subject}</TableCell>
                    <TableCell>{c.member_name ?? "-"}</TableCell>
                    <TableCell>{c.unit_number ?? "-"}</TableCell>
                    <TableCell>{c.category_name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "RESOLVED" || c.status === "CLOSED"
                            ? "default"
                            : c.status === "IN_PROGRESS"
                            ? "secondary"
                            : "destructive"
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

