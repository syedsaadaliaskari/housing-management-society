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

type Vehicle = {
  id: number;
  member_name: string | null;
  unit_number: string | null;
  registration_number: string;
  vehicle_type: string | null;
  brand: string | null;
  color: string | null;
  sticker_number: string | null;
};

type Member = {
  id: number;
  first_name: string;
  last_name: string | null;
};

type Unit = {
  id: number;
  unit_number: string;
};

export function VehiclesClient() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filtered, setFiltered] = useState<Vehicle[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [memberId, setMemberId] = useState<string | undefined>();
  const [unitId, setUnitId] = useState("NONE");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("NONE");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [stickerNumber, setStickerNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [vehiclesRes, membersRes, unitsRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/members"),
        fetch("/api/units"),
      ]);
      if (vehiclesRes.ok) {
        const data = (await vehiclesRes.json()) as Vehicle[];
        setVehicles(data);
        setFiltered(data);
      }
      if (membersRes.ok) setMembers(await membersRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch {
      toast.error("Failed to load vehicles data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(vehicles);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      vehicles.filter(
        (v) =>
          v.registration_number.toLowerCase().includes(q) ||
          (v.member_name ?? "").toLowerCase().includes(q) ||
          (v.brand ?? "").toLowerCase().includes(q) ||
          (v.vehicle_type ?? "").toLowerCase().includes(q),
      ),
    );
  }, [search, vehicles]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!memberId) {
      toast.error("Please select a member.");
      return;
    }
    if (!registrationNumber) {
      toast.error("Registration number is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: Number(memberId),
          unitId: unitId !== "NONE" ? Number(unitId) : null,
          registrationNumber,
          vehicleType: vehicleType !== "NONE" ? vehicleType : null,
          brand: brand || null,
          color: color || null,
          stickerNumber: stickerNumber || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to add vehicle.");
        return;
      }

      toast.success("Vehicle added successfully.");
      await load();
      setMemberId(undefined);
      setUnitId("NONE");
      setRegistrationNumber("");
      setVehicleType("NONE");
      setBrand("");
      setColor("");
      setStickerNumber("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* ADD VEHICLE FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Add Vehicle</CardTitle>
          <CardDescription>
            Register a resident vehicle and link it to a member and unit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.first_name} {m.last_name ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No members found. Add members first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Unit (optional)</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No unit</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration number</Label>
              <Input
                id="registrationNumber"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                required
                placeholder="e.g. ABC-123"
              />
            </div>

            <div className="space-y-2">
              <Label>Vehicle type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Not specified</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Bike">Bike</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. White"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stickerNumber">Sticker number</Label>
              <Input
                id="stickerNumber"
                value={stickerNumber}
                onChange={(e) => setStickerNumber(e.target.value)}
                placeholder="Optional"
              />
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
                "Add vehicle"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* VEHICLES TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>
            All registered vehicles in the society.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by registration, member or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32 hidden sm:block" />
                  <Skeleton className="h-4 w-16 hidden md:block" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                  <Skeleton className="h-4 w-16 hidden md:block" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                🚗
              </div>
              <p className="font-medium text-sm">No vehicles found</p>
              <p className="text-xs text-muted-foreground">
                Add your first vehicle using the form.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Member
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Brand
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Color
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">
                        {v.registration_number}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {v.member_name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {v.unit_number ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.vehicle_type ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {v.brand ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {v.color ?? "—"}
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
