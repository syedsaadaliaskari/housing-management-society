"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ResidentNotice = {
  id: number;
  title: string;
  content: string;
  priority: string;
  audience_scope: string;
  start_at: string;
  end_at: string | null;
  created_at: string;
};

export function ResidentNoticesClient() {
  const [notices, setNotices] = useState<ResidentNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/resident/notices");
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to load notices");
        }
        const data = (await res.json()) as ResidentNotice[];
        setNotices(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading latest notices...
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (notices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        There are no active notices at the moment.
      </p>
    );
  }

  const formatPriorityVariant = (priority: string) => {
    if (priority === "HIGH") return "destructive";
    if (priority === "MEDIUM") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      {notices.map((notice) => (
        <Card key={notice.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>{notice.title}</CardTitle>
              <CardDescription>
                Posted on {new Date(notice.created_at).toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={formatPriorityVariant(notice.priority)}>
                {notice.priority}
              </Badge>
              <span className="text-xs text-muted-foreground uppercase">
                {notice.audience_scope}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{notice.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

