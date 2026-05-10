import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const head = headers.map(escapeCSV).join(",");
  const body = rows
    .map((r) => headers.map((h) => escapeCSV(r[h])).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

function fmt(n: unknown) {
  return `Rs ${Number(n ?? 0).toLocaleString("en-PK")}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildPDF(data: ReportData): string {
  const net = Number(data.totalIncome) - Number(data.totalExpense);
  const netColor = net >= 0 ? "#16a34a" : "#dc2626";

  const summaryRows = [
    ["Total Income", fmt(data.totalIncome), "#16a34a"],
    ["Total Expenses", fmt(data.totalExpense), "#dc2626"],
    ["Outstanding", fmt(data.outstanding), "#d97706"],
    ["Net Balance", fmt(net), netColor],
  ];

  const monthlyRows = data.monthlyData
    .map(
      (m) => `
      <tr>
        <td>${m.month}</td>
        <td style="color:#16a34a">${fmt(m.income)}</td>
        <td style="color:#dc2626">${fmt(m.expense)}</td>
        <td style="color:${Number(m.income) - Number(m.expense) >= 0 ? "#16a34a" : "#dc2626"}">
          ${fmt(Number(m.income) - Number(m.expense))}
        </td>
      </tr>`,
    )
    .join("");

  const defaulterRows = data.defaulters
    .map(
      (d) => `
      <tr>
        <td>${d.member_name ?? "—"}</td>
        <td>${d.email ?? "—"}</td>
        <td>${d.unit_number ?? "—"}</td>
        <td style="color:#dc2626;font-weight:600">${fmt(d.balance_amount)}</td>
        <td>${fmtDate(d.due_date)}</td>
      </tr>`,
    )
    .join("");

  const outstandingRows = data.outstandingBills
    .map(
      (b) => `
      <tr>
        <td>${b.member_name ?? "—"}</td>
        <td>${b.email ?? "—"}</td>
        <td style="font-weight:600">${fmt(b.balance_amount)}</td>
        <td>${fmtDate(b.due_date)}</td>
        <td><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:9999px;font-size:11px">${b.status}</span></td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Financial Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size:13px; color:#1a1a1a; padding:32px; background:#fff; }
  h1 { font-size:22px; font-weight:700; margin-bottom:4px; }
  .subtitle { color:#6b7280; font-size:12px; margin-bottom:28px; }
  .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
  .summary-card { border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; }
  .summary-card .label { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
  .summary-card .value { font-size:18px; font-weight:700; }
  h2 { font-size:15px; font-weight:600; margin-bottom:10px; margin-top:4px; }
  table { width:100%; border-collapse:collapse; margin-bottom:28px; }
  th { background:#f9fafb; text-align:left; padding:8px 10px; font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:#6b7280; border-bottom:1px solid #e5e7eb; }
  td { padding:8px 10px; border-bottom:1px solid #f3f4f6; font-size:12px; }
  tr:last-child td { border-bottom:none; }
  .footer { margin-top:32px; border-top:1px solid #e5e7eb; padding-top:12px; color:#9ca3af; font-size:11px; display:flex; justify-content:space-between; }
  @media print { body { padding:20px; } }
</style>
</head>
<body>
  <h1>Financial Report</h1>
  <p class="subtitle">Generated on ${new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} &nbsp;·&nbsp; Housing Society Management System</p>

  <div class="summary-grid">
    ${summaryRows
      .map(
        ([label, value, color]) => `
      <div class="summary-card">
        <div class="label">${label}</div>
        <div class="value" style="color:${color}">${value}</div>
      </div>`,
      )
      .join("")}
  </div>

  <h2>Monthly Income vs Expenses (Last 6 Months)</h2>
  <table>
    <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th></tr></thead>
    <tbody>${monthlyRows || "<tr><td colspan='4' style='color:#9ca3af'>No data</td></tr>"}</tbody>
  </table>

  <h2>Defaulters (Top 10)</h2>
  <table>
    <thead><tr><th>Member</th><th>Email</th><th>Unit</th><th>Balance</th><th>Due Date</th></tr></thead>
    <tbody>${defaulterRows || "<tr><td colspan='5' style='color:#9ca3af'>No defaulters</td></tr>"}</tbody>
  </table>

  <h2>Outstanding Bills (Top 10)</h2>
  <table>
    <thead><tr><th>Member</th><th>Email</th><th>Balance</th><th>Due Date</th><th>Status</th></tr></thead>
    <tbody>${outstandingRows || "<tr><td colspan='5' style='color:#9ca3af'>No outstanding bills</td></tr>"}</tbody>
  </table>

  <div class="footer">
    <span>Housing Society Management System</span>
    <span>Confidential — Admin use only</span>
  </div>
</body>
</html>`;
}

type ReportData = {
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

async function getReportData(): Promise<ReportData> {
  const [incomeRow] = (await (sql as any)`
    SELECT COALESCE(SUM(amount),0)::text AS total_income FROM payments WHERE status='SUCCESS'
  `) as { total_income: string }[];

  const [expenseRow] = (await (sql as any)`
    SELECT COALESCE(SUM(amount),0)::text AS total_expense FROM society_expenses
  `) as { total_expense: string }[];

  const [outstandingRow] = (await (sql as any)`
    SELECT COALESCE(SUM(balance_amount),0)::text AS outstanding
    FROM bills WHERE status IN ('PENDING','PARTIALLY_PAID','OVERDUE')
  `) as { outstanding: string }[];

  const [defaulterRow] = (await (sql as any)`
    SELECT COUNT(*)::int AS defaulter_count FROM bills
    WHERE balance_amount > 0 AND due_date < CURRENT_DATE
  `) as { defaulter_count: number }[];

  const monthlyData = (await (sql as any)`
    SELECT
      TO_CHAR(month_series,'Mon YY') AS month,
      COALESCE(SUM(p.amount) FILTER (WHERE p.status='SUCCESS'),0)::text AS income,
      COALESCE(SUM(e.amount),0)::text AS expense
    FROM generate_series(
      date_trunc('month',NOW()) - INTERVAL '5 months',
      date_trunc('month',NOW()),
      '1 month'
    ) AS month_series
    LEFT JOIN payments p ON date_trunc('month',p.created_at) = month_series
    LEFT JOIN society_expenses e ON date_trunc('month',e.expense_date) = month_series
    GROUP BY month_series ORDER BY month_series ASC
  `) as { month: string; income: string; expense: string }[];

  const defaulters = (await (sql as any)`
    SELECT
      CONCAT(m.first_name,' ',COALESCE(m.last_name,'')) AS member_name,
      m.email, u.unit_number,
      b.balance_amount::text,
      TO_CHAR(b.due_date,'YYYY-MM-DD') AS due_date
    FROM bills b
    JOIN units u ON u.id=b.unit_id
    LEFT JOIN unit_residents ur ON ur.unit_id=b.unit_id AND ur.to_date IS NULL
    LEFT JOIN members m ON m.id=ur.member_id
    WHERE b.balance_amount>0 AND b.due_date<CURRENT_DATE
    ORDER BY b.due_date ASC LIMIT 10
  `) as ReportData["defaulters"];

  const outstandingBills = (await (sql as any)`
    SELECT
      CONCAT(m.first_name,' ',COALESCE(m.last_name,'')) AS member_name,
      m.email,
      b.total_amount::text AS amount,
      b.balance_amount::text,
      TO_CHAR(b.due_date,'YYYY-MM-DD') AS due_date,
      b.status
    FROM bills b
    JOIN units u ON u.id=b.unit_id
    LEFT JOIN unit_residents ur ON ur.unit_id=b.unit_id AND ur.to_date IS NULL
    LEFT JOIN members m ON m.id=ur.member_id
    WHERE b.status IN ('PENDING','PARTIALLY_PAID','OVERDUE')
    ORDER BY b.due_date ASC LIMIT 10
  `) as ReportData["outstandingBills"];

  return {
    totalIncome: incomeRow.total_income,
    totalExpense: expenseRow.total_expense,
    outstanding: outstandingRow.outstanding,
    defaulterCount: defaulterRow.defaulter_count,
    monthlyData,
    defaulters,
    outstandingBills,
  };
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format"); // "csv" | "pdf"

  const data = await getReportData();
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const sections: string[] = [];

    sections.push("FINANCIAL SUMMARY");
    sections.push(
      toCSV(
        ["Metric", "Value"],
        [
          { Metric: "Total Income", Value: fmt(data.totalIncome) },
          { Metric: "Total Expenses", Value: fmt(data.totalExpense) },
          { Metric: "Outstanding", Value: fmt(data.outstanding) },
          {
            Metric: "Net Balance",
            Value: fmt(Number(data.totalIncome) - Number(data.totalExpense)),
          },
          { Metric: "Defaulter Count", Value: String(data.defaulterCount) },
        ],
      ),
    );

    sections.push("\nMONTHLY BREAKDOWN");
    sections.push(
      toCSV(
        ["Month", "Income", "Expenses", "Net"],
        data.monthlyData.map((m) => ({
          Month: m.month,
          Income: fmt(m.income),
          Expenses: fmt(m.expense),
          Net: fmt(Number(m.income) - Number(m.expense)),
        })),
      ),
    );

    sections.push("\nDEFAULTERS");
    sections.push(
      toCSV(
        ["Member", "Email", "Unit", "Balance Due", "Due Date"],
        data.defaulters.map((d) => ({
          Member: d.member_name,
          Email: d.email,
          Unit: d.unit_number ?? "",
          "Balance Due": fmt(d.balance_amount),
          "Due Date": fmtDate(d.due_date),
        })),
      ),
    );

    sections.push("\nOUTSTANDING BILLS");
    sections.push(
      toCSV(
        ["Member", "Email", "Balance", "Due Date", "Status"],
        data.outstandingBills.map((b) => ({
          Member: b.member_name,
          Email: b.email,
          Balance: fmt(b.balance_amount),
          "Due Date": fmtDate(b.due_date),
          Status: b.status,
        })),
      ),
    );

    return new NextResponse(sections.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="financial-report-${dateStamp}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const html = buildPDF(data);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="financial-report-${dateStamp}.html"`,
      },
    });
  }

  return NextResponse.json(
    { error: "Invalid format. Use ?format=csv or ?format=pdf" },
    { status: 400 },
  );
}
