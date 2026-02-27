import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PollsClient } from "./PollsClient";

const PollsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Polls &amp; Voting
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure and review online voting for society decisions and elections.
        </p>
      </div>
      <PollsClient />
    </div>
  );
};

export default PollsPage;


