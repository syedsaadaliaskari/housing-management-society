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

export function ExpensesClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [payee, setPayee] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/expenses");
        if (!res.ok) {
          throw new Error("Failed to load expenses");
        }
        const data = (await res.json()) as Expense[];
        setExpenses(data);
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

    if (!description || !expenseDate || !amount) {
      setError("Description, date, and amount are required");
      return;
    }

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: categoryId ? Number(categoryId) : null,
        description,
        expenseDate,
        amount: Number(amount),
        paymentMode: paymentMode || null,
        payee: payee || null,
        invoiceNumber: invoiceNumber || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to add expense");
      return;
    }

    const refreshed = await fetch("/api/expenses");
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Expense[];
      setExpenses(data);
    }

    setCategoryId("");
    setDescription("");
    setExpenseDate("");
    setAmount("");
    setPaymentMode("");
    setPayee("");
    setInvoiceNumber("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
          <CardDescription>
            Record a society expense and optionally link it to a category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Security salaries, elevator repair, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category ID (optional)</Label>
                <Input
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder="numeric ID from expense_categories"
                />
              </div>
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
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment mode</Label>
                <Input
                  id="paymentMode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  placeholder="CASH, BANK_TRANSFER, etc."
                />
              </div>
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
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Add expense</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Recent expenses recorded for the society.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No expenses found. Record the first expense using the form.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Payee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.expense_date}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>{e.category_name ?? "-"}</TableCell>
                    <TableCell>{e.amount}</TableCell>
                    <TableCell>{e.payment_mode ?? "-"}</TableCell>
                    <TableCell>{e.payee ?? "-"}</TableCell>
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

