import { redirect } from "next/navigation";
import { checkUserInviteStatus } from "@/app/server-functions/auth-helper";

interface InviteGuardProps {
  children: React.ReactNode;
}

export default async function InviteGuard({ children }: InviteGuardProps) {
  const status = await checkUserInviteStatus();

  // If user is authenticated but not invited, redirect to not-invited page
  if (status.isAuthenticated && !status.isInvited) {
    redirect("/not-invited");
  }

  // If user is not authenticated, let the normal auth flow handle it
  // If user is authenticated and invited, render the children
  return <>{children}</>;
}
