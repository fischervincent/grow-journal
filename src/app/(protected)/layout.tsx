import type React from "react";
import type { Metadata } from "next";
import "../globals.css";
import { Navigation } from "@/components/navigation";
import InviteGuard from "@/components/InviteGuard";

export const metadata: Metadata = {
  title: "Plant Care Assistant",
  description: "Keep track of your plants and their care schedule",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col min-h-[100dvh] bg-[#f8faf7]">
        <Navigation />
        <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <InviteGuard>{children}</InviteGuard>
        </main>
      </div>
    </>
  );
}
