import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ResidentBookingsClient } from "./ResidentBookingsClient";

const ResidentBookingsPage = async () => {
  const session = await auth();
  if (!session || (session.user as any).role !== "RESIDENT") redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Book a Facility
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse available amenities and submit a booking request.
        </p>
      </div>
      <ResidentBookingsClient />
    </div>
  );
};

export default ResidentBookingsPage;
