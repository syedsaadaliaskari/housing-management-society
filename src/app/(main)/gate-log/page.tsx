import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GateLogClient } from "./GateLogClient";

const GateLogPage = async () => {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Gate Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Record and monitor all entry and exit movements at society gates.
        </p>
      </div>
      <GateLogClient />
    </div>
  );
};

export default GateLogPage;
