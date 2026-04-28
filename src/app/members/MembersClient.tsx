"use client";

import { useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";

type Member = {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_primary: string;
  ownership_status: string;
};

const ownershipColor: Record<string, string> = {
  OWNER: "bg-green-500/20 text-green-600 border-green-500/30",
  TENANT: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  BOTH: "bg-purple-500/20 text-purple-600 border-purple-500/30",
};

export function MembersClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrimary, setPhonePrimary] = useState("");
  const [ownershipStatus, setOwnershipStatus] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("Failed to load members");
      const data = (await res.json()) as Member[];
      setMembers(data);
      setFiltered(data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let result = members;
    if (statusFilter !== "ALL") {
      result = result.filter((m) => m.ownership_status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          `${m.first_name} ${m.last_name ?? ""}`.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone_primary.includes(q),
      );
    }
    setFiltered(result);
  }, [search, statusFilter, members]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ownershipStatus) {
      toast.error("Please select ownership status.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phonePrimary,
          ownershipStatus,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to add member.");
        return;
      }

      const newMember = (await res.json()) as Member;
      setMembers((prev) => [newMember, ...prev]);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhonePrimary("");
      setOwnershipStatus(undefined);
      toast.success("Member added successfully.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* ADD FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Add Member</CardTitle>
          <CardDescription>
            Create a new resident record with basic contact details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Ali"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Khan"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ali@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Primary phone</Label>
                <Input
                  id="phone"
                  value={phonePrimary}
                  onChange={(e) => setPhonePrimary(e.target.value)}
                  required
                  placeholder="03001234567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ownership status</Label>
              <Select
                value={ownershipStatus}
                onValueChange={setOwnershipStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="TENANT">Tenant</SelectItem>
                  <SelectItem value="BOTH">Owner &amp; Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                "Add member"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* MEMBERS TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>All residents in the society.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="TENANT">Tenant</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40 hidden sm:block" />
                  <Skeleton className="h-4 w-28 hidden md:block" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                👥
              </div>
              <p className="font-medium text-sm">No members found</p>
              <p className="text-xs text-muted-foreground">
                Add your first member using the form.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Phone
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.first_name} {m.last_name ?? ""}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {m.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {m.phone_primary}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            ownershipColor[m.ownership_status] ?? ""
                          }`}
                        >
                          {m.ownership_status}
                        </span>
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
