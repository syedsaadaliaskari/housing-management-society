"use client";

import { useEffect, useState, FormEvent } from "react";
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
import { Badge } from "@/components/ui/badge";

type Unit = {
  id: number;
  unit_number: string;
  block_name: string | null;
  floor: number | null;
  unit_type_name: string;
  area_sq_ft: string | null;
  is_active: boolean;
};

type Block = {
  id: number;
  name: string;
};

type UnitType = {
  id: number;
  code: string;
  name: string;
};

export function UnitsClient() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filtered, setFiltered] = useState<Unit[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [unitNumber, setUnitNumber] = useState("");
  const [blockId, setBlockId] = useState<string>("NONE");
  const [floor, setFloor] = useState("");
  const [unitTypeId, setUnitTypeId] = useState<string | undefined>();
  const [areaSqFt, setAreaSqFt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [unitsRes, blocksRes, unitTypesRes] = await Promise.all([
          fetch("/api/units"),
          fetch("/api/blocks"),
          fetch("/api/unit-types"),
        ]);

        if (unitsRes.ok) {
          const data = (await unitsRes.json()) as Unit[];
          setUnits(data);
          setFiltered(data);
        }
        if (blocksRes.ok) setBlocks(await blocksRes.json());
        if (unitTypesRes.ok) setUnitTypes(await unitTypesRes.json());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(units);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      units.filter(
        (u) =>
          u.unit_number.toLowerCase().includes(q) ||
          (u.block_name ?? "").toLowerCase().includes(q) ||
          u.unit_type_name.toLowerCase().includes(q),
      ),
    );
  }, [search, units]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (!unitTypeId) {
      setFormError("Please select a unit type.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitNumber,
          blockId: blockId !== "NONE" ? Number(blockId) : null,
          floor: floor ? Number(floor) : null,
          unitTypeId: Number(unitTypeId),
          areaSqFt: areaSqFt ? Number(areaSqFt) : null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setFormError(body?.error ?? "Failed to add unit.");
        return;
      }

      const refreshed = await fetch("/api/units");
      if (refreshed.ok) {
        const data = (await refreshed.json()) as Unit[];
        setUnits(data);
        setFiltered(data);
      }

      setUnitNumber("");
      setBlockId("NONE");
      setFloor("");
      setUnitTypeId(undefined);
      setAreaSqFt("");
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* ADD FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Add Unit</CardTitle>
          <CardDescription>
            Register a unit and link it to a block and type.
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
                  placeholder="e.g. A-101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>
            </div>

            {/* BLOCK DROPDOWN */}
            <div className="space-y-2">
              <Label>Block (optional)</Label>
              <Select value={blockId} onValueChange={setBlockId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select block" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No block</SelectItem>
                  {blocks.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {blocks.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No blocks found. Add blocks in the database first.
                </p>
              )}
            </div>

            {/* UNIT TYPE DROPDOWN */}
            <div className="space-y-2">
              <Label>Unit type</Label>
              <Select value={unitTypeId} onValueChange={setUnitTypeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {unitTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} ({t.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unitTypes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No unit types found. Add unit types in the database first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="areaSqFt">Area (sq ft)</Label>
              <Input
                id="areaSqFt"
                type="number"
                value={areaSqFt}
                onChange={(e) => setAreaSqFt(e.target.value)}
                placeholder="e.g. 1200"
              />
            </div>

            {/* ERROR */}
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <span>⚠</span>
                <span>{formError}</span>
              </div>
            )}

            {/* SUCCESS */}
            {formSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <span>✓</span>
                <span>Unit added successfully.</span>
              </div>
            )}

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
                "Add unit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* UNITS TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Units</CardTitle>
          <CardDescription>
            All configured units with their block and type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SEARCH */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by unit, block or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} unit{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* TABLE */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading units...</p>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No units found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Block
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Floor
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Area</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.unit_number}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {u.block_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {u.unit_type_name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {u.floor ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {u.area_sq_ft ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "default" : "secondary"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
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
