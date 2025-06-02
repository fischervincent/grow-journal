import { findPlantBySlug } from "@/app/actions/plants/find-plant-by-slug";
import { PlantDetail } from "@/components/plant-detail";
import { notFound } from "next/navigation";

interface PlantPageProps {
  params: {
    slug: string;
  };
}

export default async function PlantPage({ params }: PlantPageProps) {
  const slug = (await params).slug;
  const result = await findPlantBySlug(slug);

  if (!result.data) {
    notFound();
  }

  return <PlantDetail plant={result.data} />;
}
