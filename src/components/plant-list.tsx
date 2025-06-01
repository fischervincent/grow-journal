"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Droplet, Flower, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PlantCard } from "./plant-card";
import { NewPlantDialog } from "./new-plant-dialog";
import { PlantWithId } from "@/core/domain/plant";

export default function PlantList({ plants }: { plants: PlantWithId[] }) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate days until watering/fertilizing is needed
  // Filter plants based on selected filter
  const getFilteredPlants = () => {
    let filtered = [...plants];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (plant) =>
          plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plant.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filter === "needs-water") {
      // filtered = filtered.sort((a, b) => {
      //   const aDays = calculateDaysUntil(a.lastWatered, a.wateringFrequency);
      //   const bDays = calculateDaysUntil(b.lastWatered, b.wateringFrequency);
      //   return aDays - bDays;
      // });
    } else if (filter === "needs-nutrients") {
      //filtered = filtered.sort((a, b) => {
      //  const aDays = calculateDaysUntil(
      //    a.lastFertilized,
      //    a.fertilizingFrequency
      //  );
      //  const bDays = calculateDaysUntil(
      //    b.lastFertilized,
      //    b.fertilizingFrequency
      //  );
      //  return aDays - bDays;
      //});
    }

    return filtered;
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">My Plants</h1>
        <NewPlantDialog />
      </div>

      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          className="pl-10 bg-white border-gray-200"
          placeholder="Search plants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          className={
            filter === "all"
              ? "bg-green-600 hover:bg-green-700"
              : "border-green-200 text-green-800"
          }
          onClick={() => setFilter("all")}
        >
          All Plants
        </Button>
        <Button
          variant={filter === "needs-water" ? "default" : "outline"}
          className={
            filter === "needs-water"
              ? "bg-blue-600 hover:bg-blue-700"
              : "border-blue-200 text-blue-800"
          }
          onClick={() => setFilter("needs-water")}
        >
          <Droplet className="mr-1 h-4 w-4" />
          Needs Water
        </Button>
        <Button
          variant={filter === "needs-nutrients" ? "default" : "outline"}
          className={
            filter === "needs-nutrients"
              ? "bg-amber-600 hover:bg-amber-700"
              : "border-amber-200 text-amber-800"
          }
          onClick={() => setFilter("needs-nutrients")}
        >
          <Flower className="mr-1 h-4 w-4" />
          Needs Nutrients
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {getFilteredPlants().map((plant) => (
          <PlantCard
            key={plant.slug}
            slug={plant.slug}
            name={plant.name}
            species={plant.species}
            image={"/placeholderPlant.svg"}
            location={plant.location}
            lastWatered={new Date()}
            lastFertilized={new Date()}
          />
        ))}
      </div>
    </div>
  );
}
