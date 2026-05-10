import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { VisitorsClient } from "./VisitorsClient";

const VisitorsPage = async () => {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Visitor Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Log visitor entry and exit, and manage pre-approved guests.
        </p>
      </div>
      <VisitorsClient />
    </div>
  );
};

export default VisitorsPage;
