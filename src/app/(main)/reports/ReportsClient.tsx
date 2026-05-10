"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ReportSummary = {
  totalIncome: string;
  totalExpense: string;
  outstanding: string;
  defaulterCount: number;
  monthlyData: { month: string; income: string; expense: string }[];
  defaulters: {
    member_name: string;
    email: string;
    unit_number: string | null;
    balance_amount: string;
    due_date: string;
  }[];
  outstandingBills: {
    member_name: string;
    email: string;
    amount: string;
    balance_amount: string;
    due_date: string;
    status: string;
  }[];
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  PARTIALLY_PAID: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  OVERDUE: "bg-red-500/20 text-red-600 border-red-500/30",
};

export function ReportsClient() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Failed to load reports summary");
        setSummary(await res.json());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCSV = async () => {
    setExportingCSV(true);
    try {
      const res = await fetch("/api/reports/export?format=csv");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("CSV export failed");
    } finally {
      setExportingCSV(false);
    }
  };

  const handlePDF = async () => {
    setExportingPDF(true);
    try {
      const res = await fetch("/api/reports/export?format=pdf");
      if (!res.ok) throw new Error("Export failed");
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");

      win?.addEventListener("load", () => {
        setTimeout(() => {
          win.print();
          URL.revokeObjectURL(url);
        }, 400);
      });
      toast.success("PDF report opened — use Print → Save as PDF");
    } catch {
      toast.error("PDF export failed");
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading)
    return (
      <p className="text-sm text-muted-foreground">
        Loading financial summary...
      </p>
    );
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!summary) return null;

  const chartData = summary.monthlyData.map((d) => ({
    month: d.month,
    Income: Number(d.income),
    Expense: Number(d.expense),
  }));
  const net = Number(summary.totalIncome) - Number(summary.totalExpense);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground mr-1">Export:</span>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCSV}
          disabled={exportingCSV}
          className="gap-2"
        >
          {exportingCSV ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Download CSV
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePDF}
          disabled={exportingPDF}
          className="gap-2"
        >
          {exportingPDF ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total Income</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              Rs {Number(summary.totalIncome).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Successful payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              Rs {Number(summary.totalExpense).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Society expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Outstanding</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              Rs {Number(summary.outstanding).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pending & overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Net Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${net >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              Rs {net.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Income minus expenses
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>
            Monthly comparison for the last 6 months.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => `Rs ${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>Defaulters</CardTitle>
                <CardDescription>
                  Members with overdue bills — top 10.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {summary.defaulters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No defaulters found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.defaulters.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {d.member_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {d.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.unit_number ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-red-600">
                          Rs {Number(d.balance_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(d.due_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding Bills</CardTitle>
            <CardDescription>
              Pending and overdue bills — top 10.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.outstandingBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No outstanding bills found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.outstandingBills.map((b, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {b.member_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(b.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          Rs {Number(b.balance_amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                              statusColor[b.status] ?? ""
                            }`}
                          >
                            {b.status}
                          </span>
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
    </div>
  );
}
