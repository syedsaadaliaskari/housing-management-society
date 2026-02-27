import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { NoticesClient } from "./NoticesClient";

const NoticesPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Notices
        </h1>
        <p className="text-sm text-muted-foreground">
          Publish important announcements, meetings, and updates for residents.
        </p>
      </div>
      <NoticesClient />
    </div>
  );
};

export default NoticesPage;


