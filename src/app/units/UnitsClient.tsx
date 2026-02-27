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

type Unit = {
  id: number;
  unit_number: string;
  block_name: string | null;
  floor: number | null;
  unit_type_name: string;
  area_sq_ft: string | null;
  is_active: boolean;
};

export function UnitsClient() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [unitNumber, setUnitNumber] = useState("");
  const [blockId, setBlockId] = useState("");
  const [floor, setFloor] = useState("");
  const [unitTypeId, setUnitTypeId] = useState("");
  const [areaSqFt, setAreaSqFt] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/units");
        if (!res.ok) {
          throw new Error("Failed to load units");
        }
        const data = (await res.json()) as Unit[];
        setUnits(data);
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

    if (!unitNumber || !unitTypeId) {
      setError("Unit number and unit type ID are required");
      return;
    }

    const res = await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitNumber,
        blockId: blockId ? Number(blockId) : null,
        floor: floor ? Number(floor) : null,
        unitTypeId: Number(unitTypeId),
        areaSqFt: areaSqFt ? Number(areaSqFt) : null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to add unit");
      return;
    }

    // Reload units list
    const refreshed = await fetch("/api/units");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Unit[];
      setUnits(data);
    }

    setUnitNumber("");
    setBlockId("");
    setFloor("");
    setUnitTypeId("");
    setAreaSqFt("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Add Unit</CardTitle>
          <CardDescription>
            Register a unit and link it to block and type master data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitNumber">Unit number</Label>
                <Input
                  id="unitNumber"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blockId">Block ID (optional)</Label>
                <Input
                  id="blockId"
                  value={blockId}
                  onChange={(e) => setBlockId(e.target.value)}
                  placeholder="numeric ID"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitTypeId">Unit type ID</Label>
                <Input
                  id="unitTypeId"
                  value={unitTypeId}
                  onChange={(e) => setUnitTypeId(e.target.value)}
                  required
                  placeholder="numeric ID from unit_types"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="areaSqFt">Area (sq ft)</Label>
              <Input
                id="areaSqFt"
                type="number"
                value={areaSqFt}
                onChange={(e) => setAreaSqFt(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Add unit</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Units</CardTitle>
          <CardDescription>
            Configured units with their block and type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading units...</p>
          ) : units.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No units found. Add your first unit using the form.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Area</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>{unit.unit_number}</TableCell>
                    <TableCell>{unit.block_name ?? "-"}</TableCell>
                    <TableCell>{unit.unit_type_name}</TableCell>
                    <TableCell>{unit.floor ?? "-"}</TableCell>
                    <TableCell>{unit.area_sq_ft ?? "-"}</TableCell>
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

