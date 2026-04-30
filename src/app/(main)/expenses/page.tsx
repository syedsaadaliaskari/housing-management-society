import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ExpensesClient } from "./ExpensesClient";

const ExpensesPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Expenses
        </h1>
        <p className="text-sm text-muted-foreground">
          Capture and categorize society expenses like salaries and repairs.
        </p>
      </div>
      <ExpensesClient />
    </div>
  );
};

export default ExpensesPage;


