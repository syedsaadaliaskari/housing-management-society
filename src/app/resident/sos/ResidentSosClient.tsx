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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

export function ResidentSosClient() {
  const [alerts, setAlerts] = useState<ResidentSos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sosAlertType, setSosAlertType] = useState<string | undefined>("MEDICAL");
  const [sosMessage, setSosMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/resident/sos");
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to load alerts");
        }
        const data = (await res.json()) as ResidentSos[];
        setAlerts(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Trigger SOS alert</CardTitle>
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
          <CardTitle>My alerts</CardTitle>
          <CardDescription>
            Emergency alerts you have raised and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : alerts.length === 0 ? (
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
  );
}

