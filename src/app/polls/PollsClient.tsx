"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusColor: Record<string, string> = {
  OPEN: "bg-green-500/20 text-green-600 border-green-500/30",
  DRAFT: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  CLOSED: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

export function PollsClient() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filtered, setFiltered] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [optionInputs, setOptionInputs] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = polls;
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [search, statusFilter, polls]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/polls");
      if (res.ok) {
        const data = (await res.json()) as Poll[];
        setPolls(data);
        setFiltered(data);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    setOptionInputs((opts) => {
      const next = [...opts];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const nonEmptyOptions = optionInputs.map((o) => o.trim()).filter(Boolean);
    if (nonEmptyOptions.length < 2) {
      setFormError("Please add at least 2 options.");
      return;
    }

    setSubmitting(true);
    try {
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
        setFormError(body?.error ?? "Failed to create poll.");
        return;
      }

      await load();
      setTitle("");
      setDescription("");
      setStatus("DRAFT");
      setStartAt("");
      setEndAt("");
      setOptionInputs(["", ""]);
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* CREATE POLL FORM */}
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
                placeholder="e.g. Elect new committee members"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief context for the poll"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt">Start at (optional)</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">End at (optional)</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
            </div>

            {/* OPTIONS */}
            <div className="space-y-2">
              <Label>Options (min. 2)</Label>
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
                onClick={() => setOptionInputs((opts) => [...opts, ""])}
              >
                + Add option
              </Button>
            </div>

            {/* ERROR */}
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <span>⚠</span>
                <span>{formError}</span>
              </div>
            )}

            {/* SUCCESS */}
            {formSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <span>✓</span>
                <span>Poll created successfully.</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create poll"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* POLLS TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Polls</CardTitle>
          <CardDescription>
            All society polls with their current status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} poll{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* TABLE */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading polls...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No polls found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Options
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Start
                    </TableHead>
                    <TableHead className="hidden md:table-cell">End</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.title}</span>
                          {p.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-48">
                              {p.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            statusColor[p.status] ?? ""
                          }`}
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {p.options.length === 0
                          ? "—"
                          : p.options.map((o) => o.option_text).join(", ")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(p.start_at)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(p.end_at)}
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
