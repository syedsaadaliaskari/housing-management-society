import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { InventoryClient } from "./InventoryClient";

const InventoryPage = async () => {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Inventory Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Track society assets, supplies, and equipment stock levels.
        </p>
      </div>
      <InventoryClient />
    </div>
  );
};

export default InventoryPage;
