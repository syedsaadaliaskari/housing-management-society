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

type Vehicle = {
  id: number;
  registration_number: string;
  vehicle_type: string | null;
  brand: string | null;
  color: string | null;
  sticker_number: string | null;
};

export function VehiclesClient() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [stickerNumber, setStickerNumber] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/vehicles");
        if (!res.ok) {
          throw new Error("Failed to load vehicles");
        }
        const data = (await res.json()) as Vehicle[];
        setVehicles(data);
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

    if (!memberId || !registrationNumber) {
      setError("Member ID and registration number are required");
      return;
    }

    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: Number(memberId),
        unitId: unitId ? Number(unitId) : null,
        registrationNumber,
        vehicleType: vehicleType || null,
        brand: brand || null,
        color: color || null,
        stickerNumber: stickerNumber || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to add vehicle");
      return;
    }

    const refreshed = await fetch("/api/vehicles");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Vehicle[];
      setVehicles(data);
    }

    setMemberId("");
    setUnitId("");
    setRegistrationNumber("");
    setVehicleType("");
    setBrand("");
    setColor("");
    setStickerNumber("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Add Vehicle</CardTitle>
          <CardDescription>
            Register a resident vehicle and link it to a member and unit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberId">Member ID</Label>
                <Input
                  id="memberId"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  required
                  placeholder="numeric ID from members"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitId">Unit ID (optional)</Label>
                <Input
                  id="unitId"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  placeholder="numeric ID from units"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration number</Label>
              <Input
                id="registrationNumber"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Type</Label>
                <Input
                  id="vehicleType"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="Car, Bike, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stickerNumber">Sticker number</Label>
              <Input
                id="stickerNumber"
                value={stickerNumber}
                onChange={(e) => setStickerNumber(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Add vehicle</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>
            Vehicles registered in the society.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading vehicles...</p>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No vehicles found. Add the first vehicle using the form.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Sticker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.registration_number}</TableCell>
                    <TableCell>{v.vehicle_type ?? "-"}</TableCell>
                    <TableCell>{v.brand ?? "-"}</TableCell>
                    <TableCell>{v.color ?? "-"}</TableCell>
                    <TableCell>{v.sticker_number ?? "-"}</TableCell>
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

