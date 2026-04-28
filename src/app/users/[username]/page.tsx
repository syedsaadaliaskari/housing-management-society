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

const SingleUserPage = async ({ params }: { params: { username: string } }) => {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const user = await getUser(params.username);
  if (!user) notFound();

  const fullName = user.first_name
    ? `${user.first_name} ${user.last_name ?? ""}`.trim()
    : user.email;

  const initials = user.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : user.email[0].toUpperCase();

  // Profile completion
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
    <div className="">
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

      {/* CONTAINER */}
      <div className="mt-4 flex flex-col xl:flex-row gap-8">
        {/* LEFT */}
        <div className="w-full xl:w-1/3 space-y-6">
          {/* USER BADGES CONTAINER */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <h1 className="text-xl font-semibold">User Badges</h1>
            <div className="flex gap-4 mt-4">
              {user.is_active && (
                <HoverCard>
                  <HoverCardTrigger>
                    <BadgeCheck
                      size={36}
                      className="rounded-full bg-blue-500/30 border border-blue-500/50 p-2"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <h1 className="font-bold mb-2">Verified User</h1>
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
                      className="rounded-full bg-green-800/30 border border-green-800/50 p-2"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <h1 className="font-bold mb-2">Admin</h1>
                    <p className="text-sm text-muted-foreground">
                      Admin users have access to all features and can manage
                      users.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
              {user.member_id && (
                <HoverCard>
                  <HoverCardTrigger>
                    <Candy
                      size={36}
                      className="rounded-full bg-yellow-500/30 border border-yellow-500/50 p-2"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <h1 className="font-bold mb-2">Member Linked</h1>
                    <p className="text-sm text-muted-foreground">
                      This user is linked to a society member record.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
              {user.ownership_status && (
                <HoverCard>
                  <HoverCardTrigger>
                    <Citrus
                      size={36}
                      className="rounded-full bg-orange-500/30 border border-orange-500/50 p-2"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <h1 className="font-bold mb-2">{user.ownership_status}</h1>
                    <p className="text-sm text-muted-foreground">
                      This user has an ownership status in the society.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          </div>

          {/* INFORMATION CONTAINER */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">User Information</h1>
              <Sheet>
                <SheetTrigger asChild>
                  <Button>Edit User</Button>
                </SheetTrigger>
                <EditUser />
              </Sheet>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex flex-col gap-2 mb-8">
                <p className="text-sm text-muted-foreground">
                  Profile completion
                </p>
                <Progress value={completionPct} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Full Name:</span>
                <span>{fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Phone:</span>
                <span>{user.phone_primary ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Ownership:</span>
                <span>{user.ownership_status ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Role:</span>
                <Badge>{user.role}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Status:</span>
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Joined on {joinedDate}
            </p>
          </div>

          {/* CARD LIST CONTAINER */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <CardList title="Recent Transactions" />
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full xl:w-2/3 space-y-6">
          {/* USER CARD CONTAINER */}
          <div className="bg-primary-foreground p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="size-12">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold">{fullName}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Badge variant="outline">{user.role}</Badge>
              {user.ownership_status && (
                <Badge variant="outline">{user.ownership_status}</Badge>
              )}
              <Badge variant={user.is_active ? "default" : "secondary"}>
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* CHART CONTAINER */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <h1 className="text-xl font-semibold">User Activity</h1>
            <AppLineChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleUserPage;
