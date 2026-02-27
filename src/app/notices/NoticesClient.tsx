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

export function NoticesClient() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<string | undefined>("MEDIUM");
  const [audienceScope, setAudienceScope] = useState<string | undefined>("ALL");
  const [blockId, setBlockId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notices");
        if (!res.ok) {
          throw new Error("Failed to load notices");
        }
        const data = (await res.json()) as Notice[];
        setNotices(data);
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

    if (!title || !content || !priority) {
      setError("Title, content, and priority are required");
      return;
    }

    const res = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        priority,
        audienceScope: audienceScope ?? "ALL",
        blockId: blockId ? Number(blockId) : null,
        startAt: startAt || null,
        endAt: endAt || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to publish notice");
      return;
    }

    const refreshed = await fetch("/api/notices");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Notice[];
      setNotices(data);
    }

    setTitle("");
    setContent("");
    setPriority("MEDIUM");
    setAudienceScope("ALL");
    setBlockId("");
    setStartAt("");
    setEndAt("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Input
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Short description of the notice"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select
                  value={audienceScope}
                  onValueChange={(value) => setAudienceScope(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All residents</SelectItem>
                    <SelectItem value="OWNERS">Owners</SelectItem>
                    <SelectItem value="TENANTS">Tenants</SelectItem>
                    <SelectItem value="BLOCK">Specific block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blockId">Block ID (if audience is block)</Label>
                <Input
                  id="blockId"
                  value={blockId}
                  onChange={(e) => setBlockId(e.target.value)}
                  placeholder="numeric ID from blocks"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Publish notice</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Notices</CardTitle>
          <CardDescription>
            Recent notices visible to residents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading notices...</p>
          ) : notices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notices published yet. Create the first notice using the form.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Active from</TableHead>
                  <TableHead>Active until</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>{n.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          n.priority === "HIGH"
                            ? "destructive"
                            : n.priority === "MEDIUM"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {n.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{n.audience_scope}</TableCell>
                    <TableCell>{n.start_at}</TableCell>
                    <TableCell>{n.end_at ?? "-"}</TableCell>
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

