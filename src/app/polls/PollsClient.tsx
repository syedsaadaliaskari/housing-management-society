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

type PollOption = {
  id: number;
  poll_id: number;
  option_text: string;
  sort_order: number;
};

type Poll = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  options: PollOption[];
};

export function PollsClient() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | undefined>("DRAFT");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [optionInputs, setOptionInputs] = useState<string[]>(["", ""]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/polls");
        if (!res.ok) {
          throw new Error("Failed to load polls");
        }
        const data = (await res.json()) as Poll[];
        setPolls(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOptionChange = (index: number, value: string) => {
    setOptionInputs((opts) => {
      const next = [...opts];
      next[index] = value;
      return next;
    });
  };

  const handleAddOptionInput = () => {
    setOptionInputs((opts) => [...opts, ""]);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const nonEmptyOptions = optionInputs.map((o) => o.trim()).filter(Boolean);

    if (!title || !status || nonEmptyOptions.length === 0) {
      setError("Title, status, and at least one option are required");
      return;
    }

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        status,
        startAt: startAt || null,
        endAt: endAt || null,
        options: nonEmptyOptions,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to create poll");
      return;
    }

    const refreshed = await fetch("/api/polls");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Poll[];
      setPolls(data);
    }

    setTitle("");
    setDescription("");
    setStatus("DRAFT");
    setStartAt("");
    setEndAt("");
    setOptionInputs(["", ""]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Create Poll</CardTitle>
          <CardDescription>
            Configure a new poll for society decisions or elections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startAt">Start at</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">End at</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {optionInputs.map((value, index) => (
                  <Input
                    key={index}
                    value={value}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required={index < 2}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOptionInput}
              >
                Add option
              </Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Create poll</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Polls</CardTitle>
          <CardDescription>
            Existing polls with their current status and options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading polls...</p>
          ) : polls.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No polls created yet. Create the first poll using the form.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
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
                    <TableCell>{p.start_at ?? "-"}</TableCell>
                    <TableCell>{p.end_at ?? "-"}</TableCell>
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

