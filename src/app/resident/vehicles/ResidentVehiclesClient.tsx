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
import { Trash2, Car } from "lucide-react";

type Vehicle = {
  id: number;
  registration_number: string;
  vehicle_type: string | null;
  brand: string | null;
  color: string | null;
  sticker_number: string | null;
  unit_number: string | null;
};

export function ResidentVehiclesClient() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("NONE");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [stickerNumber, setStickerNumber] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resident/vehicles");
      if (!res.ok) throw new Error("Failed");
      setVehicles(await res.json());
    } catch {
      toast.error("Could not load your vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim()) {
      toast.error("Registration number is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/resident/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber,
          vehicleType: vehicleType !== "NONE" ? vehicleType : null,
          brand: brand || null,
          color: color || null,
          stickerNumber: stickerNumber || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Failed to register vehicle");
        return;
      }
      toast.success("Vehicle registered successfully");
      setRegistrationNumber("");
      setVehicleType("NONE");
      setBrand("");
      setColor("");
      setStickerNumber("");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, reg: string) => {
    if (!confirm(`Remove vehicle ${reg}?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/resident/vehicles?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Failed to remove vehicle");
        return;
      }
      toast.success("Vehicle removed");
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* REGISTER FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Register a Vehicle</CardTitle>
          <CardDescription>
            Add your vehicle to the society registry. It will be linked to your
            unit automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg">Registration number *</Label>
              <Input
                id="reg"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. ABC-123"
                required
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
              <Label htmlFor="sticker">Sticker number</Label>
              <Input
                id="sticker"
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
                  Registering...
                </span>
              ) : (
                "Register vehicle"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* VEHICLES LIST */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>My Vehicles</CardTitle>
          <CardDescription>
            All vehicles registered under your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 hidden sm:block" />
                  <Skeleton className="h-4 w-20 hidden md:block" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center gap-2">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                <Car className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">No vehicles registered</p>
              <p className="text-xs text-muted-foreground">
                Use the form to register your first vehicle.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Brand
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Color
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Sticker
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">
                        {v.registration_number}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {v.vehicle_type ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {v.brand ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {v.color ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {v.sticker_number ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === v.id}
                          onClick={() =>
                            handleDelete(v.id, v.registration_number)
                          }
                        >
                          {deletingId === v.id ? (
                            <span className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
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
  );
}
