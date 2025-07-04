import { redirect } from "next/navigation";
import { checkCurrentUserAdminStatus } from "@/app/server-functions/auth-helper";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default async function AdminGuard({ children }: AdminGuardProps) {
  const status = await checkCurrentUserAdminStatus();

  // If user is not authenticated, redirect to sign in
  if (!status.isAuthenticated) {
    redirect("/auth/sign-in");
  }

  // If user is authenticated but not admin, redirect to access denied
  if (!status.isAdmin) {
    redirect("/access-denied");
  }

  return <>{children}</>;
}
