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
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

type Notice = {
  id: number;
  title: string;
  content: string;
  priority: string;
  audience_scope: string;
  block_id: number | null;
  start_at: string;
  end_at: string | null;
  created_at: string;
};

type Block = {
  id: number;
  name: string;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const priorityColor: Record<string, string> = {
  HIGH: "bg-red-500/20 text-red-600 border-red-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  LOW: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

export function NoticesClient() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filtered, setFiltered] = useState<Notice[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [audienceScope, setAudienceScope] = useState("ALL");
  const [blockId, setBlockId] = useState("NONE");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [noticesRes, blocksRes] = await Promise.all([
          fetch("/api/notices"),
          fetch("/api/blocks"),
        ]);
        if (noticesRes.ok) {
          const data = (await noticesRes.json()) as Notice[];
          setNotices(data);
          setFiltered(data);
        }
        if (blocksRes.ok) setBlocks(await blocksRes.json());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let result = notices;
    if (priorityFilter !== "ALL") {
      result = result.filter((n) => n.priority === priorityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [search, priorityFilter, notices]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (!title || !content) {
      setFormError("Title and content are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          priority,
          audienceScope,
          blockId: blockId !== "NONE" ? Number(blockId) : null,
          startAt: startAt || null,
          endAt: endAt || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setFormError(body?.error ?? "Failed to publish notice.");
        return;
      }

      const refreshed = await fetch("/api/notices");
      if (refreshed.ok) {
        const data = (await refreshed.json()) as Notice[];
        setNotices(data);
        setFiltered(data);
      }

      setTitle("");
      setContent("");
      setPriority("MEDIUM");
      setAudienceScope("ALL");
      setBlockId("NONE");
      setStartAt("");
      setEndAt("");
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* PUBLISH NOTICE FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Publish Notice</CardTitle>
          <CardDescription>
            Share announcements and important updates with residents.
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
                placeholder="e.g. Water supply disruption on Friday"
              />
            </div>

            {/* TEXTAREA instead of Input */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Full details of the notice..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audienceScope} onValueChange={setAudienceScope}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All residents</SelectItem>
                    <SelectItem value="OWNERS">Owners only</SelectItem>
                    <SelectItem value="TENANTS">Tenants only</SelectItem>
                    <SelectItem value="BLOCK">Specific block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* BLOCK DROPDOWN — only show when audience is BLOCK */}
            {audienceScope === "BLOCK" && (
              <div className="space-y-2">
                <Label>Block</Label>
                <Select value={blockId} onValueChange={setBlockId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Select a block</SelectItem>
                    {blocks.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {blocks.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No blocks found in database.
                  </p>
                )}
              </div>
            )}

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
                <span>Notice published successfully.</span>
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
                  Publishing...
                </span>
              ) : (
                "Publish notice"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* NOTICES TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Notices</CardTitle>
          <CardDescription>
            All published notices visible to residents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} notice{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* TABLE */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading notices...</p>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notices found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Audience
                    </TableHead>
                    <TableHead className="hidden md:table-cell">From</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Until
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{n.title}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-48">
                            {n.content}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            priorityColor[n.priority] ?? ""
                          }`}
                        >
                          {n.priority}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {n.audience_scope}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(n.start_at)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(n.end_at)}
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
