import Link from "next/link";
import { Home, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8faf7] flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="relative mx-auto w-32 h-32 mb-4">
            <div className="absolute inset-0 bg-[#e8f5e9] rounded-full flex items-center justify-center">
              <Leaf className="h-16 w-16 text-[#2e7d32]" />
            </div>
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-sm">
              <span className="text-2xl font-bold text-[#2e7d32]">404</span>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#2e7d32] mb-4">
          Oops! This plant got lost
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          The page you&apos;re looking for seems to have wandered off into the
          garden. Let&apos;s get you back to your plants!
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full bg-[#2e7d32] hover:bg-[#1b5e20]">
            <Link href="/plants">
              <Home className="h-4 w-4 mr-2" />
              Back to My Plants
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/events">View Events</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
