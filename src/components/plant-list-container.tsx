import { findPlantsByUser } from "@/app/actions/plants/find-plants-by-user";
import { getQuickAccessEventTypes } from "@/app/actions/plantEventTypes/get-quick-access-event-types";
import PlantList from "./plant-list";
import { getSortableEventTypesByUser } from "@/app/actions/plantEventTypes/get-sortable-event-types";

export default async function PlantListContainer() {
  const { data: plants } = await findPlantsByUser();
  const quickAccessEvents = await getQuickAccessEventTypes();
  const sortableEvents = await getSortableEventTypesByUser();

  if (!plants) {
    return <div>No plants found</div>;
  }

  return (
    <PlantList
      plants={plants}
      quickAccessEvents={quickAccessEvents}
      sortableEventTypes={sortableEvents}
    />
  );
}
