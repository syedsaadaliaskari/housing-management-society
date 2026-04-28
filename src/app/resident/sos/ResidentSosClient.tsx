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

export function ResidentSosClient() {
  const [alerts, setAlerts] = useState<ResidentSos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [sosAlertType, setSosAlertType] = useState<string | undefined>(
    "MEDICAL",
  );
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

    setSubmitting(true);
    try {
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Trigger SOS Alert</CardTitle>
          <CardDescription>
            Use for emergencies only. Alerts will be visible to security and
            admin immediately.
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
            <Button
              type="submit"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Trigger SOS"}
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
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have not raised any emergency alerts.
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
  );
}
