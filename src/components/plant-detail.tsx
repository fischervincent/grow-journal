"use client";

import { PlantWithId } from "@/core/domain/plant";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Droplet, Flower, MapPin, ArrowLeft, Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DeletePlantButton } from "@/components/delete-plant-button";
import { useState, useEffect } from "react";

type PlantDetailProps = {
  plant: PlantWithId;
};

export function PlantDetail({ plant }: PlantDetailProps) {
  const router = useRouter();
  const [isDeleted, setIsDeleted] = useState(false);

  // Check if plant is already deleted
  useEffect(() => {
    if (plant.deletedAt) {
      setIsDeleted(true);
      const timer = setTimeout(() => {
        router.back();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [plant.deletedAt, router]);

  const handleBack = () => {
    router.back();
  };

  const handleWater = async () => {
    // TODO: Implement watering logic
    console.log("Water plant:", plant.slug);
  };

  const handleFertilize = async () => {
    // TODO: Implement fertilizing logic
    console.log("Fertilize plant:", plant.slug);
  };

  const handleDeleteSuccess = () => {
    setIsDeleted(true);
    // there is a redirecting (back) in the useEffect that will happend
    // since the delete action will trigger a revalidation of this page and the plant has been deleted
  };

  if (isDeleted) {
    return (
      <div className="container max-w-2xl px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Plant Deleted Successfully
            </h2>
            <p className="text-gray-500">Redirecting to your plants...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl px-4 py-6">
      <div className="mb-6">
        <Button
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
          variant="ghost"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to plants
        </Button>
      </div>

      <Card>
        <div className="relative h-64 sm:h-96">
          <Image
            src="/placeholderPlant.svg"
            alt={plant.name}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>

        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{plant.name}</h1>
            {plant.species && (
              <span className="text-sm text-gray-500">{plant.species}</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {plant.location && (
            <div className="flex items-center text-gray-500">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{plant.location}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-1 flex items-center text-blue-700">
                <Droplet className="h-4 w-4 mr-1" />
                Last Watered
              </h3>
              <p className="text-sm text-gray-600">Not watered yet</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg">
              <h3 className="font-medium mb-1 flex items-center text-amber-700">
                <Flower className="h-4 w-4 mr-1" />
                Last Fertilized
              </h3>
              <p className="text-sm text-gray-600">Not fertilized yet</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-4">
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handleWater}
          >
            <Droplet className="h-4 w-4 mr-2" />
            Water Plant
          </Button>
          <Button
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            onClick={handleFertilize}
          >
            <Flower className="h-4 w-4 mr-2" />
            Fertilize Plant
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-6 flex justify-end">
        <DeletePlantButton
          plantId={plant.id}
          plantName={plant.name}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </div>
    </div>
  );
}
