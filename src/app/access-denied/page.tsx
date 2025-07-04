import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <ShieldX className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-800">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to access this page. Admin access
              is required.
            </p>
            <p className="text-sm text-gray-600">
              If you believe this is an error, please contact an administrator.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/plants" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to Plants
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link
                href="javascript:history.back()"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
