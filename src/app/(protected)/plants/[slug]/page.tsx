import { findPlantBySlug } from "@/app/server-functions/plants/find-plant-by-slug";
import { PlantDetailContainer } from "@/components/plant-detail-container";
import { notFound } from "next/navigation";

interface PlantPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PlantPage({ params }: PlantPageProps) {
  const { slug } = await params;
  const [plant] = await findPlantBySlug(slug);

  if (!plant) {
    notFound();
  }

  return <PlantDetailContainer plant={plant} />;
}
