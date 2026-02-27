import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ResidentNoticesClient } from "./ResidentNoticesClient";

const ResidentNoticesPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "RESIDENT") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notice board</h1>
        <p className="text-sm text-muted-foreground">
          View important announcements and society updates.
        </p>
      </div>
      <ResidentNoticesClient />
    </div>
  );
};

export default ResidentNoticesPage;

