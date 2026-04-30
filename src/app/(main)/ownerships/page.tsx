import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OwnershipsClient } from "./OwnershipsClient";

const OwnershipsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Ownership History
        </h1>
        <p className="text-sm text-muted-foreground">
          Track historical ownership, sales, and transfers for each unit.
        </p>
      </div>
      <OwnershipsClient />
    </div>
  );
};

export default OwnershipsPage;


