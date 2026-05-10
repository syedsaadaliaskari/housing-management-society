import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AmenitiesClient } from "./AmenitiesClient";

const AmenitiesPage = async () => {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Facilities & Bookings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage society amenities and approve resident booking requests.
        </p>
      </div>
      <AmenitiesClient />
    </div>
  );
};

export default AmenitiesPage;
