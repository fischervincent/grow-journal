"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // If this is a NotInvitedError, redirect to not-invited page
    if (error.name === "NotInvitedError") {
      redirect("/not-invited");
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-800">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            An error occurred while loading this page. Please try again.
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              Try again
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to home
              </Link>
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <summary className="cursor-pointer font-mono">
                Error details (dev only)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {error.message}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
