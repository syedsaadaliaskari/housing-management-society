import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ResidentPollsClient } from "./ResidentPollsClient";

const ResidentPollsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "RESIDENT") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Polling</h1>
        <p className="text-sm text-muted-foreground">
          Vote on important society matters and elections.
        </p>
      </div>
      <ResidentPollsClient />
    </div>
  );
};

export default ResidentPollsPage;

