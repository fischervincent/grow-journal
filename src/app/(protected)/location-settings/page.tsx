import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getLocations } from "@/app/server-functions/plants/get-locations";
import { LocationSettingsContainer } from "@/components/location-settings-container";

export default async function LocationSettingsPage() {
  const [locations] = await getLocations();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Account
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">Location Settings</h1>
      <LocationSettingsContainer initialLocations={locations} />
    </div>
  );
}
