import { auth } from "@/lib/auth";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { PlantEventTypeList } from "./plant-event-type-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PlantEventsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const plantEventRepository = getPlantEventTypeRepository();
  const events = await plantEventRepository.findByUserId(session.user.id);

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
      <h1 className="text-3xl font-bold mb-8">Plant Event Settings</h1>
      <PlantEventTypeList fetchedEventTypes={events} />
    </div>
  );
}
