"use client";

import { useEffect, useState, FormEvent } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

type Member = {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_primary: string;
  ownership_status: string;
};

export function MembersClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrimary, setPhonePrimary] = useState("");
  const [ownershipStatus, setOwnershipStatus] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) {
          throw new Error("Failed to load members");
        }
        const data = (await res.json()) as Member[];
        setMembers(data);
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

    if (!ownershipStatus) {
      setError("Please select ownership status");
      return;
    }

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
      setError(body?.error ?? "Failed to add member");
      return;
    }

    const newMember = (await res.json()) as Member;
    setMembers((prev) => [newMember, ...prev]);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhonePrimary("");
    setOwnershipStatus(undefined);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Primary phone</Label>
                <Input
                  id="phone"
                  value={phonePrimary}
                  onChange={(e) => setPhonePrimary(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ownership status</Label>
              <Select
                value={ownershipStatus}
                onValueChange={(value) => setOwnershipStatus(value)}
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
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Add member</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Recently added residents in the society.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members found. Add the first member using the form.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.first_name}{" "}
                      {member.last_name ? member.last_name : ""}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone_primary}</TableCell>
                    <TableCell>{member.ownership_status}</TableCell>
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

