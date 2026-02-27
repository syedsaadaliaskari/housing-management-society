import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ResidentSosClient } from "./ResidentSosClient";

const ResidentSosPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "RESIDENT") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Emergency alerts</h1>
        <p className="text-sm text-muted-foreground">
          Raise SOS alerts and review their status.
        </p>
      </div>
      <ResidentSosClient />
    </div>
  );
};

export default ResidentSosPage;

