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

const Homepage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const summary = await loadAdminSummary();
  const recentMembers = await loadRecentMembers();

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

      {/* STATS CARDS — 2 cols on mobile, 3 on md, 5 on xl */}
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

      {/* CHARTS ROW — stacked on mobile, side by side on lg */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payments Over Time</CardTitle>
            <CardDescription>
              Monthly payment collections trend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppAreaChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Breakdown of society expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppBarChart />
          </CardContent>
        </Card>
      </div>

      {/* RECENT MEMBERS + PIE CHART — stacked on mobile, side by side on lg */}
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
              /* Scrollable on small screens */
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
                        <TableCell className="hidden sm:table-cell text-xs">
                          {m.email}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
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

        {/* PIE CHART */}
        <Card>
          <CardHeader>
            <CardTitle>Ownership Breakdown</CardTitle>
            <CardDescription>
              Owner vs Tenant vs Both distribution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppPieChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

async function loadAdminSummary(): Promise<AdminSummary> {
  const [memberRow] = (await (sql as any)`
    SELECT COUNT(*)::int AS total_members
    FROM members
    WHERE is_active = TRUE
  `) as { total_members: number }[];

  const [unitRow] = (await (sql as any)`
    SELECT COUNT(*)::int AS total_units
    FROM units
    WHERE is_active = TRUE
  `) as { total_units: number }[];

  const [complaintRow] = (await (sql as any)`
    SELECT COUNT(*)::int AS open_complaints
    FROM complaints
    WHERE status IN ('OPEN', 'IN_PROGRESS')
  `) as { open_complaints: number }[];

  const [alertRow] = (await (sql as any)`
    SELECT COUNT(*)::int AS active_alerts
    FROM emergency_alerts
    WHERE status IN ('ACTIVE', 'ACKNOWLEDGED')
  `) as { active_alerts: number }[];

  const [outstandingRow] = (await (sql as any)`
    SELECT COALESCE(SUM(balance_amount), 0)::text AS outstanding_dues
    FROM bills
    WHERE status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')
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
  const rows = (await (sql as any)`
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone_primary,
      ownership_status,
      created_at
    FROM members
    WHERE is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 8
  `) as RecentMember[];

  return rows;
}

export default Homepage;
