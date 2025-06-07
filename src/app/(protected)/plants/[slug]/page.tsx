import { findPlantBySlug } from "@/app/actions/plants/find-plant-by-slug";
import { PlantDetailContainer } from "@/components/plant-detail-container";
import { notFound } from "next/navigation";

interface PlantPageProps {
  params: {
    slug: string;
  };
}

export default async function PlantPage({ params }: PlantPageProps) {
  const result = await findPlantBySlug(params.slug);

  if (!result.success || !result.data) {
    notFound();
  }

  return <PlantDetailContainer plant={result.data} />;
}
