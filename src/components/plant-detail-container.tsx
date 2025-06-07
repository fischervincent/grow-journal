import { PlantWithPhotoAndId } from "@/core/domain/plant";
import { getPlantPhotos } from "@/app/actions/plants/get-plant-photos";
import { getLocations } from "@/app/actions/plants/get-locations";
import { PlantDetail } from "./plant-detail";

interface PlantDetailContainerProps {
  plant: PlantWithPhotoAndId;
}

export async function PlantDetailContainer({
  plant,
}: PlantDetailContainerProps) {
  const [photosResult, locationsResult] = await Promise.all([
    getPlantPhotos(plant.id),
    getLocations(),
  ]);
  console.log("locationsResult", locationsResult);
  return (
    <PlantDetail
      plant={plant}
      initialPhotos={photosResult.error ? [] : photosResult.photos}
      locations={locationsResult}
    />
  );
}
