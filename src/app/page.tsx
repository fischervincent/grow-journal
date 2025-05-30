import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { ArrowRight, Droplet, Flower, Bell } from "lucide-react";
import LandingHeader from "@/components/landing-header";
import LandingFooter from "@/components/landing-footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-green-800">
                  Keep Your Plants Thriving
                </h1>
                <p className="text-xl text-gray-600">
                  Never forget to water your plants again. Simple tracking,
                  smart reminders, happy plants.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative mx-auto aspect-video overflow-hidden">
                HERO IMAGE PLACEHOLDER
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-green-800 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">
              Simple tools to keep your plants healthy
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="rounded-full bg-green-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Droplet className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Watering</h3>
              <p className="text-gray-600">
                Get reminded when each plant needs water based on its schedule
              </p>
            </div>
            <div className="text-center">
              <div className="rounded-full bg-amber-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Flower className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Care Tracking</h3>
              <p className="text-gray-600">
                Track watering, fertilizing, and other care activities
              </p>
            </div>
            <div className="text-center">
              <div className="rounded-full bg-blue-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Notifications</h3>
              <p className="text-gray-600">
                Never miss a watering with timely reminders
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-green-50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-green-800 mb-4">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Your Plants</h3>
              <p className="text-gray-600">
                Add your plants with their watering schedule
              </p>
            </div>
            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Reminders</h3>
              <p className="text-gray-600">
                Receive notifications when plants need care
              </p>
            </div>
            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Care</h3>
              <p className="text-gray-600">
                Log care activities and watch plants thrive
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sign Up Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-green-800 mb-4">
                Start Today
              </h2>
              <p className="text-gray-600">
                Join thousands of happy plant parents
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <Tabs defaultValue="signup" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                </TabsList>
                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      placeholder="your@email.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input id="password-signup" type="password" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the{" "}
                      <Link href="#" className="text-green-600 hover:underline">
                        Terms of Service
                      </Link>
                    </label>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Create Account
                  </Button>
                </TabsContent>
                <TabsContent value="signin" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input
                      id="email-signin"
                      placeholder="your@email.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">Password</Label>
                    <Input id="password-signin" type="password" />
                  </div>
                  <div className="text-right">
                    <Link
                      href="#"
                      className="text-sm text-green-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Sign In
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
