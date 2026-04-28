"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

type EditUserProps = {
  userId: number;
  email: string;
  role: string;
  isActive: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  onUpdated?: (updated: { role: string; is_active: boolean }) => void;
};

const EditUser = ({
  userId,
  email,
  role,
  isActive,
  firstName,
  lastName,
  phone,
  onUpdated,
}: EditUserProps) => {
  const [selectedRole, setSelectedRole] = useState(role);
  const [selectedStatus, setSelectedStatus] = useState(
    isActive ? "ACTIVE" : "INACTIVE",
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          role: selectedRole,
          is_active: selectedStatus === "ACTIVE",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to update user");
        return;
      }

      toast.success("User updated successfully");
      onUpdated?.({
        role: selectedRole,
        is_active: selectedStatus === "ACTIVE",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Edit User</SheetTitle>
        <SheetDescription>
          Update role and status for this user.
        </SheetDescription>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6 px-1">
        {/* READ ONLY INFO */}
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input
            value={firstName ? `${firstName} ${lastName ?? ""}`.trim() : "—"}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone ?? "—"} disabled className="bg-muted" />
        </div>

        {/* EDITABLE FIELDS */}
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="RESIDENT">Resident</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </SheetContent>
  );
};

export default EditUser;
