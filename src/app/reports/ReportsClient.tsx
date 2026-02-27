"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ReportSummary = {
  totalIncome: string;
  totalExpense: string;
  outstanding: string;
  defaulterCount: number;
};

export function ReportsClient() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) {
          throw new Error("Failed to load reports summary");
        }
        const data = (await res.json()) as ReportSummary;
        setSummary(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading financial summary...</p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Income</CardTitle>
          <CardDescription>Successful payments received to date.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            Rs {Number(summary.totalIncome).toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Expenses</CardTitle>
          <CardDescription>Recorded society expenses to date.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            Rs {Number(summary.totalExpense).toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Outstanding</CardTitle>
          <CardDescription>
            Remaining amount due across pending/overdue bills.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            Rs {Number(summary.outstanding).toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Defaulters</CardTitle>
          <CardDescription>
            Bills with a balance amount past the due date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {summary.defaulterCount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

