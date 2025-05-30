"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function LandingHeader() {
  const callbackURL = useSearchParams()?.get("callbackURL");
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link className="flex items-center"
          href={{
            pathname: "/",
            query: callbackURL ? { callbackURL } : undefined
          }}>

          <span className="text-2xl font-bold text-green-600">PlantCare</span>
        </Link>
        <div className="hidden md:flex gap-4">
          <Link href={{
            pathname: "/signin",
            query: callbackURL ? { callbackURL } : undefined
          }}>
            <Button variant="outline" className="border-green-200 text-green-700">
              Sign In
            </Button>
          </Link>
          <Link href={{
            pathname: "/signup",
            query: callbackURL ? { callbackURL } : undefined
          }}>
            <Button className="bg-green-600 hover:bg-green-700">Sign Up</Button>
          </Link>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
      {isMenuOpen && (
        <div className="container md:hidden border-t bg-white">
          <div className="flex flex-col gap-4 p-4">
            <Button variant="outline" className="border-green-200 text-green-700 w-full">
              Sign In
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 w-full">Sign Up</Button>
          </div>
        </div>
      )}
    </header>
  )
}
