import { PlantWithPhotoAndId } from "@/core/domain/plant";
import { getPlantPhotos } from "@/app/server-functions/plants/get-plant-photos";
import { getLocations } from "@/app/server-functions/plants/get-locations";
import { getPlantNotes } from "@/app/server-functions/notes/get-plant-notes";
import { PlantDetail } from "./plant-detail";

interface PlantDetailContainerProps {
  plant: PlantWithPhotoAndId;
}

export async function PlantDetailContainer({
  plant,
}: PlantDetailContainerProps) {
  const [[photos], [locations], notes] = await Promise.all([
    getPlantPhotos(plant.id),
    getLocations(),
    getPlantNotes(plant.id),
  ]);
  return (
    <PlantDetail
      plant={plant}
      initialPhotos={photos ?? []}
      initialNotes={notes}
      locations={locations}
    />
  );
}
