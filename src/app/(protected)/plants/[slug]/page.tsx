import { findPlantBySlug } from "@/app/actions/plants/find-plant-by-slug";
import { PlantDetailContainer } from "@/components/plant-detail-container";
import { notFound } from "next/navigation";

interface PlantPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PlantPage({ params }: PlantPageProps) {
  const { slug } = await params;
  const result = await findPlantBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  return <PlantDetailContainer plant={result.data} />;
}
