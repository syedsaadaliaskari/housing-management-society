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

type Expense = {
  id: number;
  category_name: string | null;
  description: string;
  expense_date: string;
  amount: string;
  payment_mode: string | null;
  payee: string | null;
  invoice_number: string | null;
};

type Category = {
  id: number;
  name: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: string) {
  return `Rs ${Number(amount).toLocaleString()}`;
}

export function ExpensesClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filtered, setFiltered] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [categoryId, setCategoryId] = useState<string>("NONE");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<string>("NONE");
  const [payee, setPayee] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [expensesRes, categoriesRes] = await Promise.all([
          fetch("/api/expenses"),
          fetch("/api/expense-categories"),
        ]);
        if (expensesRes.ok) {
          const data = (await expensesRes.json()) as Expense[];
          setExpenses(data);
          setFiltered(data);
        }
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
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
      setFiltered(expenses);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      expenses.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.category_name ?? "").toLowerCase().includes(q) ||
          (e.payee ?? "").toLowerCase().includes(q),
      ),
    );
  }, [search, expenses]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (!description || !expenseDate || !amount) {
      setFormError("Description, date, and amount are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: categoryId !== "NONE" ? Number(categoryId) : null,
          description,
          expenseDate,
          amount: Number(amount),
          paymentMode: paymentMode !== "NONE" ? paymentMode : null,
          payee: payee || null,
          invoiceNumber: invoiceNumber || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setFormError(body?.error ?? "Failed to add expense.");
        return;
      }

      const refreshed = await fetch("/api/expenses");
      if (refreshed.ok) {
        const data = (await refreshed.json()) as Expense[];
        setExpenses(data);
        setFiltered(data);
      }

      setCategoryId("NONE");
      setDescription("");
      setExpenseDate("");
      setAmount("");
      setPaymentMode("NONE");
      setPayee("");
      setInvoiceNumber("");
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* ADD EXPENSE FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
          <CardDescription>
            Record a society expense and optionally link it to a category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* DESCRIPTION */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="e.g. Security salaries, elevator repair"
              />
            </div>

            {/* CATEGORY DROPDOWN */}
            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No categories found. Add them in the database first.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Expense date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (Rs)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="e.g. 15000"
                />
              </div>
            </div>

            {/* PAYMENT MODE DROPDOWN */}
            <div className="space-y-2">
              <Label>Payment mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Not specified</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payee">Payee</Label>
                <Input
                  id="payee"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="Vendor or staff name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
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
                <span>Expense added successfully.</span>
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
                "Add expense"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* EXPENSES TABLE */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>All recorded society expenses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SEARCH */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by description, category or payee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground self-center">
              {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* TABLE */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading expenses...</p>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Mode</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Payee
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {e.description}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {e.category_name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(e.expense_date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(e.amount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {e.payment_mode ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {e.payee ?? "—"}
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
