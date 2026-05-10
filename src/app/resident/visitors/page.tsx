import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ResidentVisitorsClient } from "./ResidentVisitorsClient";

const ResidentVisitorsPage = async () => {
  const session = await auth();
  if (!session || (session.user as any).role !== "RESIDENT") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Visitors</h1>
        <p className="text-sm text-muted-foreground">
          Pre-approve guests and view your visitor history.
        </p>
      </div>
      <ResidentVisitorsClient />
    </div>
  );
};

export default ResidentVisitorsPage;
