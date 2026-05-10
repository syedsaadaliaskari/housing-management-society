"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Notif = {
  id: number;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

const TYPE_COLORS: Record<string, string> = {
  SOS: "bg-red-500/15 text-red-600 border-red-400/30",
  NOTICE: "bg-blue-500/15 text-blue-600 border-blue-400/30",
  COMPLAINT: "bg-orange-500/15 text-orange-600 border-orange-400/30",
  BILL: "bg-yellow-500/15 text-yellow-700 border-yellow-400/30",
  PAYMENT: "bg-green-500/15 text-green-600 border-green-400/30",
  BOOKING: "bg-purple-500/15 text-purple-600 border-purple-400/30",
  POLL: "bg-pink-500/15 text-pink-600 border-pink-400/30",
  GENERAL: "bg-gray-500/15 text-gray-600 border-gray-400/30",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=100");
      if (!res.ok) throw new Error("Failed");
      setNotifs(await res.json());
    } catch {
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: "all" }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const markOne = async (id: number) => {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  const displayed =
    filter === "UNREAD" ? notifs.filter((n) => !n.is_read) : notifs;
  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-md border overflow-hidden text-sm">
                {(["ALL", "UNREAD"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 transition-colors ${
                      filter === f
                        ? "bg-foreground text-background"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {f === "UNREAD" ? `Unread (${unreadCount})` : "All"}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markAllRead}
                  className="gap-1.5"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            {filter === "UNREAD"
              ? "No unread notifications"
              : "No notifications yet"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayed.map((n) => (
            <Card
              key={n.id}
              className={`transition-opacity cursor-default ${n.is_read ? "opacity-60" : ""}`}
              onClick={() => {
                if (!n.is_read) markOne(n.id);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Type badge */}
                  <span
                    className={`mt-0.5 shrink-0 text-[10px] font-semibold border px-2 py-0.5 rounded-full whitespace-nowrap ${
                      TYPE_COLORS[n.type] ?? TYPE_COLORS.GENERAL
                    }`}
                  >
                    {n.type}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {n.body}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {formatDate(n.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <span className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
