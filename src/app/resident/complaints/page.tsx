import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ResidentComplaintsClient } from "./ResidentComplaintsClient";

const ResidentComplaintsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "RESIDENT") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Complaints & suggestions
        </h1>
        <p className="text-sm text-muted-foreground">
          Submit new complaints or suggestions and track their progress.
        </p>
      </div>
      <ResidentComplaintsClient />
    </div>
  );
};

export default ResidentComplaintsPage;

