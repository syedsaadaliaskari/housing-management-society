import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SosClient } from "./SosClient";

const SosPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Emergency Alerts (SOS)
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor and respond to emergency alerts raised by residents.
        </p>
      </div>
      <SosClient />
    </div>
  );
};

export default SosPage;


