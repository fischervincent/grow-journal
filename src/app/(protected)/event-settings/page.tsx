import { auth } from "@/lib/auth";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { PlantEventTypeList } from "./plant-event-type-list";

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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Plant Event Settings</h1>
      <PlantEventTypeList fetchedEventTypes={events} />
    </div>
  );
}
