"use client";

import type React from "react";

import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Droplet, Flower, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PlantCardProps {
  slug: string;
  name: string;
  species?: string;
  image: string;
  lastWatered: Date;
  lastFertilized: Date;
  location?: string;
}

export function PlantCard(plant: PlantCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    console.log("clicked", plant.slug);
    router.push(`/plants/${plant.slug}`);
  };

  const handleWater = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking the button
    // Water logic would go here
  };

  const handleFertilize = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking the button
    // Fertilize logic would go here
  };

  return (
    <Link href={`/plants/${plant.slug}`}>
      <Card
        className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
        onClick={handleCardClick}
      >
        <div className="relative h-48">
          <Image
            src={plant.image}
            alt={plant.name}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2">{plant.name}</h3>
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{plant.location}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={handleWater}
          >
            <Droplet className="h-4 w-4 mr-1" />
            Water
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={handleFertilize}
          >
            <Flower className="h-4 w-4 mr-1" />
            Fertilize
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
