"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export function ResidentPollsClient() {
  const [polls, setPolls] = useState<ResidentPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/resident/polls");
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to load polls");
        }
        const data = (await res.json()) as ResidentPoll[];
        setPolls(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Active polls</CardTitle>
          <CardDescription>
            Participate in ongoing society polls and elections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : polls.length === 0 ? (
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
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{p.title}</div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
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
    </div>
  );
}

