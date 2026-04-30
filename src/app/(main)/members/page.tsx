import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { MembersClient } from "./MembersClient";

const MembersPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Manage resident profiles, contact details, and family information.
        </p>
      </div>
      <MembersClient />
    </div>
  );
};

export default MembersPage;


