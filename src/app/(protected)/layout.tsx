import type React from "react";
import type { Metadata } from "next";
import "../globals.css";
import { Navigation } from "@/components/navigation";

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
      <div className="flex flex-col min-h-screen bg-[#f8faf7]">
        <Navigation />
        <main>{children}</main>
      </div>
    </>
  );
}
