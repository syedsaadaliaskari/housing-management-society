import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import CardList from "@/components/CardList";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { BadgeCheck, Candy, Citrus, Shield } from "lucide-react";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import EditUser from "@/components/EditUser";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AppLineChart from "@/components/AppLineChart";

type UserDetail = {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  member_id: number | null;
  first_name: string | null;
  last_name: string | null;
  phone_primary: string | null;
  ownership_status: string | null;
};

type Payment = {
  id: number;
  amount: string;
  method: string;
  status: string;
  payment_date: string;
  reference_number: string | null;
  unit_number: string;
};

type MonthlyPayment = {
  month: string;
  total: number;
};

async function getUser(id: string): Promise<UserDetail | null> {
  const rows = (await (sql as any)`
    SELECT
      u.id,
      u.email,
      u.role,
      u.is_active,
      u.last_login_at,
      u.created_at,
      u.member_id,
      m.first_name,
      m.last_name,
      m.phone_primary,
      m.ownership_status
    FROM users u
    LEFT JOIN members m ON m.id = u.member_id
    WHERE u.id = ${Number(id)}
    LIMIT 1
  `) as UserDetail[];
  return rows[0] ?? null;
}

async function getUserPayments(
  userId: number,
): Promise<{ payments: Payment[]; monthly: MonthlyPayment[] }> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/users/${userId}/payments`, {
    cache: "no-store",
  });
  if (!res.ok) return { payments: [], monthly: [] };
  return res.json();
}

const SingleUserPage = async ({ params }: { params: { username: string } }) => {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const user = await getUser(params.username);
  if (!user) notFound();

  const { payments, monthly } = await getUserPayments(user.id);

  const fullName = user.first_name
    ? `${user.first_name} ${user.last_name ?? ""}`.trim()
    : user.email;

  const initials = user.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : user.email[0].toUpperCase();

  const fields = [
    user.first_name,
    user.last_name,
    user.email,
    user.phone_primary,
    user.ownership_status,
    user.member_id,
  ];
  const completionPct = Math.round(
    (fields.filter(Boolean).length / fields.length) * 100,
  );

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/users">Users</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT COLUMN */}
        <div className="w-full xl:w-1/3 space-y-6">
          {/* BADGES */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">User Badges</h2>
            <div className="flex flex-wrap gap-3">
              {user.is_active && (
                <HoverCard>
                  <HoverCardTrigger>
                    <BadgeCheck
                      size={36}
                      className="rounded-full bg-blue-500/30 border border-blue-500/50 p-2 cursor-pointer"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <h3 className="font-bold mb-1">Verified User</h3>
                    <p className="text-sm text-muted-foreground">
                      This user account is active and verified.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
              {user.role === "ADMIN" && (
                <HoverCard>
                  <HoverCardTrigger>
                    <Shield
                      size={36}
                      className="rounded-full bg-green-800/30 border border-green-800/50 p-2 cursor-pointer"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <h3 className="font-bold mb-1">Admin</h3>
                    <p className="text-sm text-muted-foreground">
                      Full access to all features.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
              {user.member_id && (
                <HoverCard>
                  <HoverCardTrigger>
                    <Candy
                      size={36}
                      className="rounded-full bg-yellow-500/30 border border-yellow-500/50 p-2 cursor-pointer"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <h3 className="font-bold mb-1">Member Linked</h3>
                    <p className="text-sm text-muted-foreground">
                      Linked to a society member record.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
              {user.ownership_status && (
                <HoverCard>
                  <HoverCardTrigger>
                    <Citrus
                      size={36}
                      className="rounded-full bg-orange-500/30 border border-orange-500/50 p-2 cursor-pointer"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <h3 className="font-bold mb-1">{user.ownership_status}</h3>
                    <p className="text-sm text-muted-foreground">
                      Ownership status in the society.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          </div>

          {/* USER INFO */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">User Information</h2>
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm">Edit User</Button>
                </SheetTrigger>
                <EditUser
                  userId={user.id}
                  email={user.email}
                  role={user.role}
                  isActive={user.is_active}
                  firstName={user.first_name}
                  lastName={user.last_name}
                  phone={user.phone_primary}
                />
              </Sheet>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Profile completion
                </p>
                <Progress value={completionPct} />
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-sm">
                <span className="font-semibold">Full Name</span>
                <span>{fullName}</span>
                <span className="font-semibold">Email</span>
                <span className="break-all">{user.email}</span>
                <span className="font-semibold">Phone</span>
                <span>{user.phone_primary ?? "—"}</span>
                <span className="font-semibold">Ownership</span>
                <span>{user.ownership_status ?? "—"}</span>
                <span className="font-semibold">Role</span>
                <Badge className="w-fit">{user.role}</Badge>
                <span className="font-semibold">Status</span>
                <Badge
                  variant={user.is_active ? "default" : "secondary"}
                  className="w-fit"
                >
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Joined on {joinedDate}
              </p>
            </div>
          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <CardList title="Recent Transactions" payments={payments} />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full xl:w-2/3 space-y-6">
          {/* USER CARD */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold">{fullName}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline">{user.role}</Badge>
              {user.ownership_status && (
                <Badge variant="outline">{user.ownership_status}</Badge>
              )}
              <Badge variant={user.is_active ? "default" : "secondary"}>
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* PAYMENT HISTORY CHART */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Monthly payments over the last 6 months.
            </p>
            <AppLineChart data={monthly} />
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-primary-foreground p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                Total Payments
              </p>
              <p className="text-2xl font-semibold">{payments.length}</p>
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
              <p className="text-2xl font-semibold">
                Rs{" "}
                {payments
                  .filter((p) => p.status === "SUCCESS")
                  .reduce((acc, p) => acc + Number(p.amount), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground mb-1">Last Payment</p>
              <p className="text-2xl font-semibold">
                {payments[0]
                  ? new Date(payments[0].payment_date).toLocaleDateString(
                      "en-PK",
                      { day: "numeric", month: "short" },
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleUserPage;
