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

type ResidentBooking = {
  id: number;
  amenity_name: string;
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

export function ResidentBookingsClient() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<ResidentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [amenityId, setAmenityId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, bRes] = await Promise.all([
        fetch("/api/amenities"),
        fetch("/api/resident/bookings"),
      ]);
      if (!aRes.ok || !bRes.ok) throw new Error("Failed to load");
      const aData: Amenity[] = await aRes.json();
      setAmenities(aData.filter((a) => a.is_active));
      setBookings(await bRes.json());
    } catch {
      toast.error("Could not load booking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedAmenity = amenities.find((a) => String(a.id) === amenityId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amenityId || !bookingDate || !startTime || !endTime) {
      toast.error("Please fill all required fields");
      return;
    }
    if (startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/resident/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amenityId: Number(amenityId),
          bookingDate,
          startTime,
          endTime,
          purpose: purpose || undefined,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json())?.error ?? "Failed to book");
      toast.success("Booking request submitted! Awaiting admin approval.");
      setAmenityId("");
      setBookingDate("");
      setStartTime("");
      setEndTime("");
      setPurpose("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Amenities Overview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))
          : amenities.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="font-medium">{a.name}</div>
                {a.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {a.description}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {a.capacity && <span>👥 Up to {a.capacity} persons</span>}
                  {a.open_time && a.close_time && (
                    <span>
                      🕐 {a.open_time} – {a.close_time}
                    </span>
                  )}
                  <span>
                    {Number(a.booking_fee) > 0
                      ? `💰 PKR ${a.booking_fee}`
                      : "✅ Free"}
                  </span>
                </div>
              </Card>
            ))}
      </div>

      {/* Book Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit a Booking Request</CardTitle>
          <CardDescription>
            Choose an amenity and preferred time — admin will approve or reject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="amenity">Amenity *</Label>
                <Select value={amenityId} onValueChange={setAmenityId}>
                  <SelectTrigger id="amenity">
                    <SelectValue placeholder="Select a facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {amenities.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                        {Number(a.booking_fee) > 0
                          ? ` — PKR ${a.booking_fee}`
                          : " — Free"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAmenity?.open_time && (
                  <p className="text-xs text-muted-foreground">
                    Available: {selectedAmenity.open_time} –{" "}
                    {selectedAmenity.close_time}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bookingDate">Date *</Label>
                <Input
                  id="bookingDate"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bookingPurpose">Purpose</Label>
                <Input
                  id="bookingPurpose"
                  placeholder="e.g. Birthday party"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : "Request Booking"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">
              No bookings yet. Request one above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Time</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Purpose
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Admin Notes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.amenity_name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(b.booking_date)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {b.start_time} – {b.end_time}
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
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {b.admin_notes ?? "—"}
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
