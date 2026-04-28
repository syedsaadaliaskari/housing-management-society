import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UsersClient } from "./UsersClient";

const UsersPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage all system users — admins, residents, and staff.
        </p>
      </div>
      <UsersClient />
    </div>
  );
};

export default UsersPage;
