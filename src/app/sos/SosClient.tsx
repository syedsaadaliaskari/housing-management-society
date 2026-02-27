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

type SosAlert = {
  id: number;
  member_name: string | null;
  unit_number: string | null;
  alert_type: string;
  message: string | null;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
};

export function SosClient() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [alertType, setAlertType] = useState<string | undefined>("MEDICAL");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/sos");
        if (!res.ok) {
          throw new Error("Failed to load emergency alerts");
        }
        const data = (await res.json()) as SosAlert[];
        setAlerts(data);
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

    if (!memberId || !alertType) {
      setError("Member ID and alert type are required");
      return;
    }

    const res = await fetch("/api/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: Number(memberId),
        unitId: unitId ? Number(unitId) : null,
        alertType,
        message: message || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to create emergency alert");
      return;
    }

    const refreshed = await fetch("/api/sos");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as SosAlert[];
      setAlerts(data);
    }

    setMemberId("");
    setUnitId("");
    setAlertType("MEDICAL");
    setMessage("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Trigger Emergency Alert</CardTitle>
          <CardDescription>
            Simulate an SOS alert raised by a resident for testing.
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
            <div className="space-y-2">
              <Label>Alert type</Label>
              <Select
                value={alertType}
                onValueChange={(value) => setAlertType(value)}
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
              <Label htmlFor="message">Message (optional)</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Short description of the emergency"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" variant="destructive">
              Create test alert
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Emergency Alerts</CardTitle>
          <CardDescription>
            Latest SOS alerts raised by residents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading emergency alerts...
            </p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No emergency alerts logged yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Acknowledged</TableHead>
                  <TableHead>Resolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.alert_type}</TableCell>
                    <TableCell>{a.member_name ?? "-"}</TableCell>
                    <TableCell>{a.unit_number ?? "-"}</TableCell>
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
                    <TableCell>{a.acknowledged_at ?? "-"}</TableCell>
                    <TableCell>{a.resolved_at ?? "-"}</TableCell>
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

