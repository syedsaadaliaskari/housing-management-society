import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PatrolsClient } from "./PatrolsClient";

const PatrolsPage = async () => {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Security Patrolling
        </h1>
        <p className="text-sm text-muted-foreground">
          Log guard patrol checkpoints and track security coverage.
        </p>
      </div>
      <PatrolsClient />
    </div>
  );
};

export default PatrolsPage;
