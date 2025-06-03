import { findPlantsByUser } from "@/app/actions/plants/find-plants-by-user";
import { getQuickAccessEventTypes } from "@/app/actions/plantEventTypes/get-quick-access-event-types";
import PlantList from "./plant-list";
import { getSortableEventTypesByUser } from "@/app/actions/plantEventTypes/get-sortable-event-types";
import { Suspense } from "react";

function PlantListLoading() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  );
}

export default async function PlantListContainer() {
  const { data: plants } = await findPlantsByUser();
  const quickAccessEvents = await getQuickAccessEventTypes();
  const sortableEvents = await getSortableEventTypesByUser();

  if (!plants) {
    return <div>No plants found</div>;
  }

  return (
    <Suspense fallback={<PlantListLoading />}>
      <PlantList
        plants={plants}
        quickAccessEvents={quickAccessEvents}
        sortableEventTypes={sortableEvents}
      />
    </Suspense>
  );
}
