import { findPlantsByUser } from "@/app/actions/find-plants-by-user";
import PlantList from "./plant-list";

export default async function PlantListContainer() {
  const { data } = await findPlantsByUser();

  if (!data) {
    return <div>No plants found</div>;
  }

  return <PlantList plants={data} />;
}
