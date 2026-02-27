import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UnitsClient } from "./UnitsClient";

const UnitsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Units &amp; Properties
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure flats, villas, plots, and their default charges.
        </p>
      </div>
      <UnitsClient />
    </div>
  );
};

export default UnitsPage;


