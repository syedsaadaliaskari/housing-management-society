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
import { UserCog, Lock } from "lucide-react";

type Profile = {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_primary: string;
  phone_secondary: string | null;
};

export function ResidentProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/resident/profile");
      if (res.ok) {
        const data: Profile = await res.json();
        setProfile(data);
        setFirstName(data.first_name);
        setLastName(data.last_name ?? "");
        setPhoneSecondary(data.phone_secondary ?? "");
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/resident/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName: lastName || null,
          phoneSecondary: phoneSecondary || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to save profile");
        return;
      }
      toast.success("Profile updated successfully");
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <UserCog className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            View and update your personal contact information.
          </p>
        </div>
      </div>

      {/* Read-only info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
          <CardDescription>
            These fields are managed by the admin and cannot be changed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-1">
              <dt className="text-muted-foreground flex items-center gap-1">
                <Lock className="size-3" /> Email
              </dt>
              <dd className="font-medium break-all">{profile?.email}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground flex items-center gap-1">
                <Lock className="size-3" /> Primary Phone
              </dt>
              <dd className="font-medium">{profile?.phone_primary}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Editable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Profile</CardTitle>
          <CardDescription>
            Update your name and secondary contact number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="phoneSecondary">Secondary phone (optional)</Label>
              <Input
                id="phoneSecondary"
                value={phoneSecondary}
                onChange={(e) => setPhoneSecondary(e.target.value)}
                placeholder="03009876543"
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
