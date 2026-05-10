"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // Initial fetch
  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (!res.ok) return;
      const data: Notif[] = await res.json();
      setNotifs(data);
    } catch {}
  }, []);

  // SSE stream
  useEffect(() => {
    fetchNotifs();

    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "connected") return;
      setNotifs((prev) => {
        if (prev.find((n) => n.id === data.id)) return prev;
        // Show toast for new incoming notification
        toast(data.title, {
          description: data.body ?? undefined,
          duration: 5000,
        });
        return [data, ...prev];
      });
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [fetchNotifs]);

  const unread = notifs.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: "all" }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unread > 0) {
      // Mark visible ones as read after a short delay
      setTimeout(() => markAllRead(), 1500);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(360px,90vw)] p-0 overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-medium text-sm">Notifications</span>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[min(420px,60vh)] overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifs.slice(0, 15).map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b last:border-b-0 transition-colors ${
                  n.is_read ? "opacity-60" : "bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 shrink-0 text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${
                      TYPE_COLORS[n.type] ?? TYPE_COLORS.GENERAL
                    }`}
                  >
                    {n.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-muted/20">
          <Link
            href="/notifications"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            View all notifications →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
