"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type User = {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  member_id: number | null;
  first_name: string | null;
  last_name: string | null;
  phone_primary: string | null;
  ownership_status: string | null;
};

const roleBadgeColor: Record<string, string> = {
  ADMIN: "bg-green-500/20 text-green-600 border-green-500/30",
  RESIDENT: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  STAFF: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
};

export function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to load users");
        const data = (await res.json()) as User[];
        setUsers(data);
        setFiltered(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let result = users;
    if (roleFilter !== "ALL") {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          `${u.first_name ?? ""} ${u.last_name ?? ""}`
            .toLowerCase()
            .includes(q),
      );
    }
    setFiltered(result);
  }, [search, roleFilter, users]);

  return (
    <div className="space-y-4">
      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="RESIDENT">Resident</SelectItem>
            <SelectItem value="STAFF">Staff</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground self-center">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40 hidden sm:block" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full hidden sm:block" />
              <Skeleton className="h-4 w-24 hidden md:block" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-2xl">
            👤
          </div>
          <p className="font-medium text-sm">No users found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search or filter.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const fullName = u.first_name
                  ? `${u.first_name} ${u.last_name ?? ""}`.trim()
                  : "—";
                const initials = u.first_name
                  ? `${u.first_name[0]}${u.last_name?.[0] ?? ""}`.toUpperCase()
                  : u.email[0].toUpperCase();

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Link
                        href={`/users/${u.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                          {initials}
                        </div>
                        <span className="font-medium">{fullName}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                          roleBadgeColor[u.role] ?? ""
                        }`}
                      >
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={u.is_active ? "default" : "secondary"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {u.phone_primary ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
