import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MemberProfileClient } from "./MemberProfileClient";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");

  const { id } = await params;
  return <MemberProfileClient memberId={Number(id)} />;
}
