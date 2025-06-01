"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Droplet, Flower, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PlantCard } from "./plant-card";
import { NewPlantDialog } from "./new-plant-dialog";

// Sample plant data
const initialPlants = [
  {
    id: 1,
    name: "Monstera Deliciosa",
    image: "/placeholderPlant.svg?height=200&width=200",
    lastWatered: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    lastFertilized: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    mayNeedWater: false,
    mayNeedFertilizer: true,
    wateringFrequency: 7, // days
    fertilizingFrequency: 30, // days
    location: "Living Room",
  },
  {
    id: 2,
    name: "Snake Plant",
    image: "/placeholderPlant.svg?height=200&width=200",
    lastWatered: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    lastFertilized: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    mayNeedWater: true,
    mayNeedFertilizer: true,
    wateringFrequency: 14, // days
    fertilizingFrequency: 60, // days
    location: "Bedroom",
  },
  {
    id: 3,
    name: "Fiddle Leaf Fig",
    image: "/placeholderPlant.svg?height=200&width=200",
    mayNeedWater: false,
    mayNeedFertilizer: false,
    lastWatered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    lastFertilized: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    wateringFrequency: 7, // days
    fertilizingFrequency: 30, // days
    location: "Office",
  },
  {
    id: 4,
    name: "Peace Lily",
    image: "/placeholderPlant.svg?height=200&width=200",
    mayNeedWater: false,
    mayNeedFertilizer: true,
    lastWatered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    lastFertilized: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    wateringFrequency: 5, // days
    fertilizingFrequency: 30, // days
    location: "Kitchen",
  },
  {
    id: 5,
    name: "Pothos",
    image: "/placeholderPlant.svg?height=200&width=200",
    mayNeedWater: true,
    mayNeedFertilizer: true,
    lastWatered: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    lastFertilized: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
    wateringFrequency: 10, // days
    fertilizingFrequency: 45, // days
    location: "Bathroom",
  },
];

export default function PlantList() {
  const [plants, setPlants] = useState(initialPlants);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate days until watering/fertilizing is needed
  const calculateDaysUntil = (lastDate: Date, frequency: number) => {
    const daysSince = Math.floor(
      (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return frequency - daysSince;
  };

  // Filter plants based on selected filter
  const getFilteredPlants = () => {
    let filtered = [...plants];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (plant) =>
          plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plant.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filter === "needs-water") {
      filtered = filtered.sort((a, b) => {
        const aDays = calculateDaysUntil(a.lastWatered, a.wateringFrequency);
        const bDays = calculateDaysUntil(b.lastWatered, b.wateringFrequency);
        return aDays - bDays;
      });
    } else if (filter === "needs-nutrients") {
      filtered = filtered.sort((a, b) => {
        const aDays = calculateDaysUntil(
          a.lastFertilized,
          a.fertilizingFrequency
        );
        const bDays = calculateDaysUntil(
          b.lastFertilized,
          b.fertilizingFrequency
        );
        return aDays - bDays;
      });
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
            key={plant.id}
            id={plant.id}
            name={plant.name}
            image={plant.image}
            lastWatered={plant.lastWatered}
            lastFertilized={plant.lastFertilized}
            wateringFrequency={plant.wateringFrequency}
            fertilizingFrequency={plant.fertilizingFrequency}
            mayNeedWater={plant.mayNeedWater}
            mayNeedFertilizer={plant.mayNeedFertilizer}
            location={plant.location}
          />
        ))}
      </div>
    </div>
  );
}
