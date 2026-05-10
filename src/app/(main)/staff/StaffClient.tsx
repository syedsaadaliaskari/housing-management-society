"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type Staff = {
  id: number;
  full_name: string;
  phone: string | null;
  type: string;
  company_name: string | null;
  id_card_number: string | null;
  member_name: string | null;
  unit_number: string | null;
  is_active: boolean;
  entry_time: string | null;
  exit_time: string | null;
  created_at: string;
};

type Member = { id: number; first_name: string; last_name: string | null };

const TYPES = [
  "MAID",
  "DRIVER",
  "COOK",
  "GARDENER",
  "VENDOR",
  "SECURITY",
  "OTHER",
];

const typeColor: Record<string, string> = {
  MAID: "bg-pink-500/20 text-pink-600 border-pink-500/30",
  DRIVER: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  COOK: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  GARDENER: "bg-green-500/20 text-green-600 border-green-500/30",
  VENDOR: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  SECURITY: "bg-red-500/20 text-red-600 border-red-500/30",
  OTHER: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

export function StaffClient() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filtered, setFiltered] = useState<Staff[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [memberId, setMemberId] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, mRes] = await Promise.all([
        fetch("/api/staff"),
        fetch("/api/members"),
      ]);
      if (!sRes.ok || !mRes.ok) throw new Error("Failed to load");
      setStaff(await sRes.json());
      setMembers(await mRes.json());
    } catch {
      toast.error("Could not load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let r = staff;
    if (typeFilter !== "ALL") r = r.filter((s) => s.type === typeFilter);
    if (search.trim())
      r = r.filter(
        (s) =>
          s.full_name.toLowerCase().includes(search.toLowerCase()) ||
          s.member_name?.toLowerCase().includes(search.toLowerCase()),
      );
    setFiltered(r);
  }, [search, typeFilter, staff]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName || !type) {
      toast.error("Name and type are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone: phone || undefined,
          type,
          companyName: companyName || undefined,
          idCardNumber: idCardNumber || undefined,
          memberId: memberId ? Number(memberId) : null,
          entryTime: entryTime || null,
          exitTime: exitTime || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
      toast.success("Staff / vendor added");
      setFullName("");
      setPhone("");
      setType("");
      setCompanyName("");
      setIdCardNumber("");
      setMemberId("");
      setEntryTime("");
      setExitTime("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: number, current: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Staff marked as ${!current ? "active" : "inactive"}`);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTogglingId(null);
    }
  };

  const active = staff.filter((s) => s.is_active).length;
  const inactive = staff.length - active;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: staff.length, color: "text-foreground" },
          { label: "Active", value: active, color: "text-green-600" },
          { label: "Inactive", value: inactive, color: "text-red-600" },
          {
            label: "Vendors",
            value: staff.filter((s) => s.type === "VENDOR").length,
            color: "text-purple-600",
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Staff / Vendor</CardTitle>
          <CardDescription>
            Register domestic staff, drivers, or service vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Shahid Ali"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staffType">Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="staffType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staffPhone">Phone</Label>
                <Input
                  id="staffPhone"
                  placeholder="+92 300 0000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company / Agency</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. CleanPro Services"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="idCard">CNIC / ID Card</Label>
                <Input
                  id="idCard"
                  placeholder="42101-1234567-1"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assignedMember">Assigned to Member</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger id="assignedMember">
                    <SelectValue placeholder="Select member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.first_name} {m.last_name ?? ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entryTime">Allowed Entry Time</Label>
                <Input
                  id="entryTime"
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exitTime">Allowed Exit Time</Label>
                <Input
                  id="exitTime"
                  type="time"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Adding..." : "Add Staff / Vendor"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name or member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No staff or vendors found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Phone
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">CNIC</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Assigned To
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Hours
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.full_name}</div>
                        {s.company_name && (
                          <div className="text-xs text-muted-foreground">
                            {s.company_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeColor[s.type]}>
                          {s.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {s.phone ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {s.id_card_number ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          {s.member_name?.trim() || "—"}
                        </div>
                        {s.unit_number && (
                          <div className="text-xs text-muted-foreground">
                            Unit {s.unit_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {s.entry_time && s.exit_time
                          ? `${s.entry_time} – ${s.exit_time}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            s.is_active
                              ? "bg-green-500/20 text-green-600 border-green-500/30"
                              : "bg-gray-500/20 text-gray-600 border-gray-500/30"
                          }
                        >
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={togglingId === s.id}
                          onClick={() => toggleActive(s.id, s.is_active)}
                        >
                          {s.is_active ? "Deactivate" : "Activate"}
                        </Button>
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
