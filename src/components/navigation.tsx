"use client"

import type React from "react"

import { redirect, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Cog,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();

  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name;
  const initials = getInitials(userName);

  return (
    <>
      {/* Top Navigation - Desktop only */}
      <nav className="hidden md:flex border-b bg-white justify-between items-center h-auto px-6">
        <div className="flex gap-8 items-center">
          <NavItem
            href="/plants"
            icon={<Home className="h-5 w-5" />}
            label="Plants"
            active={pathname === "/plants"}
          />
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholderPlant.svg?height=32&width=32" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{userName}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/account" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/event-settings" className="flex items-center">
                <Cog className="mr-2 h-4 w-4" />
                Event Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/location-settings" className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Locations
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      redirect("/");
                    },
                    onError: (ctx) => {
                      console.error("Sign out error:", ctx.error);
                    },
                  },
                });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        <MobileNavItem
          href="/plants"
          icon={<Home className="h-6 w-6" />}
          label="Plants"
          active={pathname === "/plants"}
        />
        <MobileNavItem
          href="/account"
          icon={<User className="h-6 w-6" />}
          label="Profile"
          active={pathname === "/account"}
        />
      </nav>
    </>
  );
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`flex items-center justify-center h-12 px-6 rounded-lg gap-2 ${
          active ? "text-[#2e7d32] border-b-2 border-[#2e7d32] rounded-none" : "text-muted-foreground"
        }`}
      >
        {icon}
        <span className="text-sm">{label}</span>
      </Button>
    </Link>
  )
}

function MobileNavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`flex flex-col items-center justify-center h-14 w-16 rounded-lg gap-0.5 ${
          active ? "text-[#2e7d32]" : "text-muted-foreground"
        }`}
      >
        {icon}
        <span className="text-xs">{label}</span>
      </Button>
    </Link>
  )
}
