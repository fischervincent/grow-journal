import { PlantWithPhotoAndId } from "@/core/domain/plant";
import { getPlantPhotos } from "@/app/server-functions/plants/get-plant-photos";
import { getLocations } from "@/app/server-functions/plants/get-locations";
import { PlantDetail } from "./plant-detail";

interface PlantDetailContainerProps {
  plant: PlantWithPhotoAndId;
}

export async function PlantDetailContainer({
  plant,
}: PlantDetailContainerProps) {
  const [[photos], [locations]] = await Promise.all([
    getPlantPhotos(plant.id),
    getLocations(),
  ]);
  return (
    <PlantDetail
      plant={plant}
      initialPhotos={photos ?? []}
      locations={locations}
    />
  );
}
