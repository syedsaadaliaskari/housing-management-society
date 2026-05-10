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

type InventoryItem = {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  low_stock_threshold: number | null;
  location: string | null;
  purchase_price: string | null;
  is_active: boolean;
  updated_at: string;
  category_name: string | null;
};

type Category = { id: number; name: string };

export function InventoryClient() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filtered, setFiltered] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [unit, setUnit] = useState("pcs");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [location, setLocation] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [iRes, cRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/inventory?type=categories"),
      ]);
      if (!iRes.ok || !cRes.ok) throw new Error("Failed to load");
      setItems(await iRes.json());
      setCategories(await cRes.json());
    } catch {
      toast.error("Could not load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let r = items;
    if (catFilter !== "ALL") r = r.filter((i) => i.category_name === catFilter);
    if (stockFilter === "LOW")
      r = r.filter((i) => i.quantity <= (i.low_stock_threshold ?? 5));
    if (stockFilter === "OK")
      r = r.filter((i) => i.quantity > (i.low_stock_threshold ?? 5));
    if (search.trim())
      r = r.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.category_name?.toLowerCase().includes(search.toLowerCase()) ||
          i.location?.toLowerCase().includes(search.toLowerCase()),
      );
    setFiltered(r);
  }, [search, catFilter, stockFilter, items]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Item name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId:
            categoryId && categoryId !== "none" ? Number(categoryId) : null,
          description: description || undefined,
          quantity: Number(quantity) || 0,
          unit: unit || "pcs",
          lowStockThreshold: Number(lowStockThreshold) || 5,
          location: location || undefined,
          purchasePrice: purchasePrice ? Number(purchasePrice) : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
      toast.success("Item added to inventory");
      setName("");
      setCategoryId("");
      setDescription("");
      setQuantity("0");
      setUnit("pcs");
      setLowStockThreshold("5");
      setLocation("");
      setPurchasePrice("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const adjustQty = async (id: number, action: "increment" | "decrement") => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, value: 1 }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch {
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const deactivate = async (id: number) => {
    setUpdatingId(id);
    try {
      await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "deactivate" }),
      });
      toast.success("Item removed from inventory");
      await load();
    } catch {
      toast.error("Failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const totalItems = items.length;
  const lowStock = items.filter(
    (i) => i.quantity <= (i.low_stock_threshold ?? 5),
  ).length;
  const totalValue = items.reduce(
    (sum, i) => sum + i.quantity * (Number(i.purchase_price) || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Items", value: totalItems, color: "text-foreground" },
          {
            label: "Low Stock",
            value: lowStock,
            color: lowStock > 0 ? "text-red-600" : "text-green-600",
          },
          {
            label: "Categories",
            value: categories.length,
            color: "text-blue-600",
          },
          {
            label: "Est. Total Value",
            value: `PKR ${totalValue.toLocaleString()}`,
            color: "text-purple-600",
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {lowStock > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          ⚠️ {lowStock} item{lowStock > 1 ? "s are" : " is"} running low on
          stock. Reorder soon.
        </div>
      )}

      {/* Add Item Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Inventory Item</CardTitle>
          <CardDescription>
            Add a new asset, supply, or equipment item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g. Mop & Bucket Set"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemCategory">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="itemCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemLocation">Storage Location</Label>
                <Input
                  id="itemLocation"
                  placeholder="e.g. Store Room 1"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemQty">Opening Quantity</Label>
                <Input
                  id="itemQty"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemUnit">Unit</Label>
                <Input
                  id="itemUnit"
                  placeholder="pcs, kg, liters..."
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lowStock">Low Stock Alert At</Label>
                <Input
                  id="lowStock"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemPrice">Unit Price (PKR)</Label>
                <Input
                  id="itemPrice"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="itemDesc">Description</Label>
                <Input
                  id="itemDesc"
                  placeholder="Optional notes"
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
              {submitting ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Stock level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Stock</SelectItem>
            <SelectItem value="LOW">Low Stock</SelectItem>
            <SelectItem value="OK">In Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No inventory items found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Location
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Unit Price
                    </TableHead>
                    <TableHead>Adjust</TableHead>
                    <TableHead>Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const isLow =
                      item.quantity <= (item.low_stock_threshold ?? 5);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {item.category_name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-semibold ${isLow ? "text-red-600" : "text-foreground"}`}
                            >
                              {item.quantity}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.unit}
                            </span>
                            {isLow && (
                              <Badge
                                variant="outline"
                                className="ml-1 text-[10px] bg-red-500/20 text-red-600 border-red-500/30"
                              >
                                Low
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {item.location ?? "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {item.purchase_price
                            ? `PKR ${item.purchase_price}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-base"
                              disabled={updatingId === item.id}
                              onClick={() => adjustQty(item.id, "decrement")}
                            >
                              −
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-base"
                              disabled={updatingId === item.id}
                              onClick={() => adjustQty(item.id, "increment")}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 border-red-500/40 hover:bg-red-500/10"
                            disabled={updatingId === item.id}
                            onClick={() => deactivate(item.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
