import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { PushNotificationsProvider } from "@/lib/notification/push/use-notification";

export const metadata: Metadata = {
  title: "Plant Care Assistant",
  description: "Keep track of your plants and their care schedule",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PushNotificationsProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </PushNotificationsProvider>
      </body>
    </html>
  );
}
