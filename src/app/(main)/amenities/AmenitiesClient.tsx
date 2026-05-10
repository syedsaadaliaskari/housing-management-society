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
import { Textarea } from "@/components/ui/textarea";
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

type Amenity = {
  id: number;
  name: string;
  description: string | null;
  capacity: number | null;
  open_time: string | null;
  close_time: string | null;
  booking_fee: string;
  is_active: boolean;
};

type Booking = {
  id: number;
  amenity_name: string;
  member_name: string | null;
  unit_number: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  APPROVED: "bg-green-500/20 text-green-600 border-green-500/30",
  REJECTED: "bg-red-500/20 text-red-600 border-red-500/30",
  CANCELLED: "bg-gray-500/20 text-gray-600 border-gray-500/30",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AmenitiesClient() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [bookingFee, setBookingFee] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, bRes] = await Promise.all([
        fetch("/api/amenities"),
        fetch("/api/bookings"),
      ]);
      if (!aRes.ok || !bRes.ok) throw new Error("Failed to load");
      setAmenities(await aRes.json());
      setBookings(await bRes.json());
    } catch {
      toast.error("Could not load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setFilteredBookings(
      statusFilter === "ALL"
        ? bookings
        : bookings.filter((b) => b.status === statusFilter),
    );
  }, [statusFilter, bookings]);

  const handleAddAmenity = async (e: FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Amenity name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/amenities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          capacity: capacity ? Number(capacity) : null,
          openTime: openTime || null,
          closeTime: closeTime || null,
          bookingFee: bookingFee ? Number(bookingFee) : 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
      toast.success("Amenity added");
      setName("");
      setDescription("");
      setCapacity("");
      setOpenTime("");
      setCloseTime("");
      setBookingFee("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateBookingStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Booking ${status.toLowerCase()}`);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleAmenity = async (id: number, current: boolean) => {
    setTogglingId(id);
    try {
      await fetch("/api/amenities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      toast.success(`Amenity ${!current ? "activated" : "deactivated"}`);
      await load();
    } catch {
      toast.error("Failed to update amenity");
    } finally {
      setTogglingId(null);
    }
  };

  const pending = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Amenities",
            value: amenities.length,
            color: "text-foreground",
          },
          {
            label: "Active",
            value: amenities.filter((a) => a.is_active).length,
            color: "text-green-600",
          },
          {
            label: "Pending Approvals",
            value: pending,
            color: "text-yellow-600",
          },
          {
            label: "Total Bookings",
            value: bookings.length,
            color: "text-blue-600",
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

      {/* Add Amenity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Amenity</CardTitle>
          <CardDescription>
            Add a bookable facility (clubhouse, pool, court, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAmenity} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="amenityName">Amenity Name *</Label>
                <Input
                  id="amenityName"
                  placeholder="e.g. Clubhouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity (persons)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bookingFee">Booking Fee (PKR)</Label>
                <Input
                  id="bookingFee"
                  type="number"
                  min="0"
                  placeholder="0 for free"
                  value={bookingFee}
                  onChange={(e) => setBookingFee(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="openTime">Opens At</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="closeTime">Closes At</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="amenityDesc">Description</Label>
                <Input
                  id="amenityDesc"
                  placeholder="Short description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Adding..." : "Add Amenity"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Amenities List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Amenities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : amenities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No amenities added yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Capacity
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Hours
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {amenities.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.name}</div>
                        {a.description && (
                          <div className="text-xs text-muted-foreground">
                            {a.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {a.capacity ? `${a.capacity} persons` : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {a.open_time && a.close_time
                          ? `${a.open_time} – ${a.close_time}`
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {Number(a.booking_fee) > 0
                          ? `PKR ${a.booking_fee}`
                          : "Free"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            a.is_active
                              ? "bg-green-500/20 text-green-600 border-green-500/30"
                              : "bg-gray-500/20 text-gray-600 border-gray-500/30"
                          }
                        >
                          {a.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={togglingId === a.id}
                          onClick={() => toggleAmenity(a.id, a.is_active)}
                        >
                          {a.is_active ? "Deactivate" : "Activate"}
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

      {/* Bookings */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Booking Requests</CardTitle>
            <CardDescription>
              Approve or reject resident facility booking requests
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No booking requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amenity</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Purpose
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.amenity_name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {b.member_name?.trim() ?? "—"}
                        </div>
                        {b.unit_number && (
                          <div className="text-xs text-muted-foreground">
                            Unit {b.unit_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        <div>{formatDate(b.booking_date)}</div>
                        <div className="text-xs text-muted-foreground">
                          {b.start_time} – {b.end_time}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {b.purpose ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColor[b.status]}
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {b.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-green-600 border-green-500/40 hover:bg-green-500/10"
                                disabled={updatingId === b.id}
                                onClick={() =>
                                  updateBookingStatus(b.id, "APPROVED")
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600 border-red-500/40 hover:bg-red-500/10"
                                disabled={updatingId === b.id}
                                onClick={() =>
                                  updateBookingStatus(b.id, "REJECTED")
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {(b.status === "APPROVED" ||
                            b.status === "REJECTED") && (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </div>
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
