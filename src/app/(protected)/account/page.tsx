"use client";

import { redirect, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "@/lib/auth-client";

export default function AccountPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name;
  const userEmail = user?.email;

  return (
    <div className="flex-1 bg-white">
      <header className="px-4 py-5 border-b bg-white flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-[#2e7d32]">
          Account Settings
        </h1>
      </header>

      <ScrollArea className="flex-1 pb-20 md:pb-4">
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/placeholder.svg?height=80&width=80" />
              <AvatarFallback className="text-xl">JD</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{userName}</h2>
              <p className="text-muted-foreground">{userEmail}</p>
              <button
                className="text-sm text-blue-600 hover:underline mt-1"
                onClick={() =>
                  signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        redirect("/");
                      },
                      onError: (ctx) => {
                        console.error("Sign out error:", ctx.error);
                      },
                    },
                  })
                }
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
