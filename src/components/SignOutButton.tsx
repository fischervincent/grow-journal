"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  redirectTo?: string;
}

export function SignOutButton({
  variant = "default",
  size = "default",
  className = "",
  children = "Sign Out",
  redirectTo = "/",
}: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push(redirectTo);
          },
          onError: (ctx) => {
            console.error("Sign out error:", ctx.error);
            // Still redirect even if there's an error
            router.push(redirectTo);
          },
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);
      // Still redirect even if there's an error
      router.push(redirectTo);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
    >
      {children}
    </Button>
  );
}
