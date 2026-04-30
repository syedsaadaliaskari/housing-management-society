import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { VehiclesClient } from "./VehiclesClient";

const VehiclesPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Vehicles
        </h1>
        <p className="text-sm text-muted-foreground">
          Maintain resident vehicle information and parking assignments.
        </p>
      </div>
      <VehiclesClient />
    </div>
  );
};

export default VehiclesPage;


