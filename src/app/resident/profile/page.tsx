import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ResidentProfileClient } from "./ResidentProfileClient";

export default async function ResidentProfilePage() {
  const session = await auth();
  if (!session || (session.user as any).role !== "RESIDENT") redirect("/");
  return <ResidentProfileClient />;
}
