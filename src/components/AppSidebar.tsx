import {
  Home,
  Users,
  Building2,
  History,
  Car,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  Bell,
  MessageSquareWarning,
  Siren,
  Vote,
  User2,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { auth } from "@/auth";

const adminOverviewItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
];

const adminMemberPropertyItems = [
  {
    title: "Members",
    url: "/members",
    icon: Users,
  },
  {
    title: "Units & Properties",
    url: "/units",
    icon: Building2,
  },
  {
    title: "Ownership History",
    url: "/ownerships",
    icon: History,
  },
  {
    title: "Vehicles",
    url: "/vehicles",
    icon: Car,
  },
];

const adminFinanceItems = [
  {
    title: "Maintenance & Utility Bills",
    url: "/billing",
    icon: FileText,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
  },
  {
    title: "Financial Reports",
    url: "/reports",
    icon: BarChart3,
  },
];

const adminCommunicationItems = [
  {
    title: "Notices",
    url: "/notices",
    icon: Bell,
  },
  {
    title: "Complaints & Requests",
    url: "/complaints",
    icon: MessageSquareWarning,
  },
  {
    title: "Emergency Alerts (SOS)",
    url: "/sos",
    icon: Siren,
  },
  {
    title: "Polls & Voting",
    url: "/polls",
    icon: Vote,
  },
];

// Resident-focused navigation
const residentDashboardItems = [
  {
    title: "My Dashboard",
    url: "/resident",
    icon: Home,
  },
];

const residentCommunityItems = [
  {
    title: "Notice Board",
    url: "/resident/notices",
    icon: Bell,
  },
  {
    title: "Complaints & Suggestions",
    url: "/resident/complaints",
    icon: MessageSquareWarning,
  },
  {
    title: "Emergency Alerts (SOS)",
    url: "/resident/sos",
    icon: Siren,
  },
  {
    title: "Polls & Voting",
    url: "/resident/polls",
    icon: Vote,
  },
];

const residentFinanceItems = [
  {
    title: "My Bills",
    url: "/resident/bills",
    icon: FileText,
  },
  {
    title: "My Payments",
    url: "/resident/payments",
    icon: CreditCard,
  },
];

const AppSidebar = async () => {
  const session = await auth();
  const user = session?.user as any | undefined;
  const role = user?.role ?? "ADMIN";
  const isResident = role === "RESIDENT";

  const displayName =
    user?.name || user?.email || (role ? `${role} user` : "User");
  const roleLabel = role;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={isResident ? "/resident" : "/"}>
                <Image src="/logo.svg" alt="logo" width={20} height={20} />
                <span>{isResident ? "Resident Portal" : "Admin Panel"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {isResident ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Overview</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {residentDashboardItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Community</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {residentCommunityItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Payments</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {residentFinanceItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Overview</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminOverviewItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Members & Properties</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMemberPropertyItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Finance & Billing</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminFinanceItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Communication</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminCommunicationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-medium leading-tight">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase">
                      {roleLabel}
                    </span>
                  </span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  {user?.email ?? "No email"}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout">Sign out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
