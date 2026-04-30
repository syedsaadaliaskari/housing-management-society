import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import AppAreaChart from "@/components/AppAreaChart";
import AppBarChart from "@/components/AppBarChart";
import AppPieChart from "@/components/AppPieChart";
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
import { Badge } from "@/components/ui/badge";

type AdminSummary = {
  totalMembers: number;
  totalUnits: number;
  openComplaints: number;
  activeAlerts: number;
  outstandingDues: string;
};

type RecentMember = {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_primary: string;
  ownership_status: string;
  created_at: string;
};

type ChartData = {
  monthlyPayments: { month: string; collected: number; outstanding: number }[];
  expensesByCategory: { category: string; total: number }[];
  ownershipBreakdown: { ownership_status: string; count: number }[];
};

const Homepage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const [summary, recentMembers, chartData] = await Promise.all([
    loadAdminSummary(),
    loadRecentMembers(),
    loadChartData(),
  ]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Society Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          High-level snapshot of members, units, complaints, and alerts.
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total Members</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {summary.totalMembers.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total Units</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {summary.totalUnits.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Residential & commercial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Open Complaints</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {summary.openComplaints.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across all residents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Active Alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {summary.activeAlerts.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-1">
            <CardDescription>Outstanding Dues</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              Rs {Number(summary.outstandingDues).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pending & overdue bills
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payments Over Time</CardTitle>
            <CardDescription>
              Monthly collected vs outstanding — last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppAreaChart data={chartData.monthlyPayments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>
              Society expense breakdown — last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppBarChart data={chartData.expensesByCategory} />
          </CardContent>
        </Card>
      </div>

      {/* RECENT MEMBERS + PIE CHART */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
            <CardDescription>
              Newly added members and their contact details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No members found yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Email
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Phone
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {m.first_name} {m.last_name ?? ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Joined{" "}
                              {new Date(m.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{m.ownership_status}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {m.email}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {m.phone_primary}
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
            <CardTitle>Ownership Breakdown</CardTitle>
            <CardDescription>
              Owner vs Tenant vs Both distribution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppPieChart data={chartData.ownershipBreakdown} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

async function loadAdminSummary(): Promise<AdminSummary> {
  const [memberRow] = (await (sql as any)`
    SELECT COUNT(*)::int AS total_members
    FROM members WHERE is_active = TRUE
  `) as { total_members: number }[];

  const [unitRow] = (await (sql as any)`
    SELECT COUNT(*)::int AS total_units
    FROM units WHERE is_active = TRUE
  `) as { total_units: number }[];

  const [complaintRow] = (await (sql as any)`
    SELECT COUNT(*)::int AS open_complaints
    FROM complaints WHERE status IN ('OPEN', 'IN_PROGRESS')
  `) as { open_complaints: number }[];

  const [alertRow] = (await (sql as any)`
    SELECT COUNT(*)::int AS active_alerts
    FROM emergency_alerts WHERE status IN ('ACTIVE', 'ACKNOWLEDGED')
  `) as { active_alerts: number }[];

  const [outstandingRow] = (await (sql as any)`
    SELECT COALESCE(SUM(balance_amount), 0)::text AS outstanding_dues
    FROM bills WHERE status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')
  `) as { outstanding_dues: string }[];

  return {
    totalMembers: memberRow?.total_members ?? 0,
    totalUnits: unitRow?.total_units ?? 0,
    openComplaints: complaintRow?.open_complaints ?? 0,
    activeAlerts: alertRow?.active_alerts ?? 0,
    outstandingDues: outstandingRow?.outstanding_dues ?? "0",
  };
}

async function loadRecentMembers(): Promise<RecentMember[]> {
  return (await (sql as any)`
    SELECT
      id, first_name, last_name, email,
      phone_primary, ownership_status, created_at
    FROM members
    WHERE is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 8
  `) as RecentMember[];
}
async function loadChartData(): Promise<ChartData> {
  const [monthlyPayments, expensesByCategory, ownershipBreakdown] =
    await Promise.all([
      (sql as any)`
        SELECT
          TO_CHAR(month_series, 'Mon YY') AS month,
          COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'SUCCESS'), 0)::int AS collected,
          COALESCE(SUM(b.balance_amount), 0)::int AS outstanding
        FROM generate_series(
          date_trunc('month', NOW()) - INTERVAL '5 months',
          date_trunc('month', NOW()),
          '1 month'
        ) AS month_series
        LEFT JOIN payments p
          ON date_trunc('month', p.created_at) = month_series
        LEFT JOIN bills b
          ON date_trunc('month', b.due_date) = month_series
          AND b.status IN ('PENDING', 'OVERDUE', 'PARTIALLY_PAID')
        GROUP BY month_series
        ORDER BY month_series ASC
      `,
      (sql as any)`
        SELECT
          COALESCE(ec.name, 'Other') AS category,
          SUM(e.amount)::int AS total
        FROM society_expenses e
        LEFT JOIN expense_categories ec ON ec.id = e.category_id
        WHERE e.expense_date >= NOW() - INTERVAL '6 months'
        GROUP BY ec.name
        ORDER BY total DESC
        LIMIT 6
      `,
      (sql as any)`
        SELECT
          ownership_status,
          COUNT(*)::int AS count
        FROM members
        WHERE is_active = TRUE
        GROUP BY ownership_status
      `,
    ]);

  return {
    monthlyPayments: monthlyPayments as ChartData["monthlyPayments"],
    expensesByCategory: expensesByCategory as ChartData["expensesByCategory"],
    ownershipBreakdown: ownershipBreakdown as ChartData["ownershipBreakdown"],
  };
}
export default Homepage;
