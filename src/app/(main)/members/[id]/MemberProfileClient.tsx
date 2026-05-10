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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, UserPlus, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

type FamilyMember = {
  id: number;
  full_name: string;
  relation: string;
  age: number | null;
  phone: string | null;
};

type Member = {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_primary: string;
  ownership_status: string;
};

export function MemberProfileClient({ memberId }: { memberId: number }) {
  const [member, setMember] = useState<Member | null>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [relation, setRelation] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    load();
  }, [memberId]);

  async function load() {
    setLoading(true);
    try {
      const [mRes, fRes] = await Promise.all([
        fetch("/api/members"),
        fetch(`/api/members/${memberId}/family`),
      ]);
      if (mRes.ok) {
        const members = (await mRes.json()) as Member[];
        setMember(members.find((m) => m.id === memberId) ?? null);
      }
      if (fRes.ok) setFamily(await fRes.json());
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/members/${memberId}/family`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          relation,
          age: age ? Number(age) : null,
          phone: phone || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to add family member");
        return;
      }
      toast.success("Family member added");
      setFullName("");
      setRelation("");
      setAge("");
      setPhone("");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (familyId: number) => {
    setDeleting(familyId);
    try {
      const res = await fetch(
        `/api/members/${memberId}/family?familyId=${familyId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        toast.error("Failed to remove family member");
        return;
      }
      toast.success("Family member removed");
      setFamily((prev) => prev.filter((f) => f.id !== familyId));
    } finally {
      setDeleting(null);
    }
  };

  const ownershipColor: Record<string, string> = {
    OWNER: "bg-green-500/20 text-green-600 border-green-500/30",
    TENANT: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    BOTH: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  };

  return (
    <div className="space-y-6 py-4">
      {/* Back link */}
      <Link
        href="/members"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to Members
      </Link>

      {/* Member info */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : member ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="flex items-center gap-2">
                <Users className="size-5 text-muted-foreground" />
                {member.first_name} {member.last_name ?? ""}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full border self-start sm:self-auto ${
                  ownershipColor[member.ownership_status] ?? ""
                }`}
              >
                {member.ownership_status}
              </span>
            </CardTitle>
            <CardDescription>Member ID #{member.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium break-all">{member.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Primary Phone</dt>
                <dd className="font-medium">{member.phone_primary}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">Member not found.</p>
      )}

      {/* Family section */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        {/* Add family form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4" /> Add Family Member
            </CardTitle>
            <CardDescription>
              Add spouse, children, parents or other family members linked to
              this resident.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Sara Ali"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relation">Relation</Label>
                <Input
                  id="relation"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  required
                  placeholder="Spouse, Son, Daughter, Parent…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fphone">Phone</Label>
                  <Input
                    id="fphone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03001234567"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding…
                  </span>
                ) : (
                  "Add Family Member"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Family table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Family Members</CardTitle>
            <CardDescription>
              {family.length} family member{family.length !== 1 ? "s" : ""}{" "}
              registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : family.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                  👨‍👩‍👧
                </div>
                <p className="font-medium text-sm">No family members added</p>
                <p className="text-xs text-muted-foreground">
                  Use the form to add family details.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Relation</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Age
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Phone
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {family.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">
                          {f.full_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.relation}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {f.age ?? "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {f.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            disabled={deleting === f.id}
                            onClick={() => handleDelete(f.id)}
                          >
                            {deleting === f.id ? (
                              <span className="size-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
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
    </div>
  );
}
