"use client"

import type React from "react"

import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Droplet, Flower, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface PlantCardProps {
  id: number
  name: string
  image: string
  lastWatered: Date
  lastFertilized: Date
  wateringFrequency: number
  fertilizingFrequency: number
  location: string
  mayNeedWater: boolean
  mayNeedFertilizer: boolean
}

export function PlantCard(plant : PlantCardProps) {
  const router = useRouter()

  // Calculate days until watering/fertilizing is needed
  const calculateDaysUntil = (lastDate: Date, frequency: number) => {
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    return frequency - daysSince
  }

  const waterDaysLeft = calculateDaysUntil(plant.lastWatered, plant.wateringFrequency)
  const nutrientDaysLeft = calculateDaysUntil(plant.lastFertilized, plant.fertilizingFrequency)

  const getWaterStatus = () => {
    if (waterDaysLeft <= 0) return { text: "Water now!", color: "text-red-600" }
    if (waterDaysLeft <= 2) return { text: `Water in ${waterDaysLeft} days`, color: "text-amber-600" }
    return { text: `Water in ${waterDaysLeft} days`, color: "text-green-600" }
  }

  const getNutrientStatus = () => {
    if (nutrientDaysLeft <= 0) return { text: "Fertilize now!", color: "text-red-600" }
    if (nutrientDaysLeft <= 5) return { text: `Fertilize in ${nutrientDaysLeft} days`, color: "text-amber-600" }
    return { text: `Fertilize in ${nutrientDaysLeft} days`, color: "text-green-600" }
  }

  const waterStatus = getWaterStatus()
  const nutrientStatus = getNutrientStatus()

  const handleCardClick = () => {
    router.push(`/plants/${plant.id}`)
  }

  const handleWater = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when clicking the button
    // Water logic would go here
  }

  const handleFertilize = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when clicking the button
    // Fertilize logic would go here
  }

  return (
    <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-md" onClick={handleCardClick}>
      <div className="relative h-48">
        <Image src={plant.image || "/placeholderPlant.svg"} alt={plant.name} fill className="object-cover" />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{plant.name}</h3>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{plant.location}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Droplet className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm">Water</span>
            </div>
            <span className={`text-sm font-medium ${waterStatus.color}`}>{waterStatus.text}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Flower className="h-4 w-4 text-amber-500 mr-2" />
              <span className="text-sm">Nutrients</span>
            </div>
            <span className={`text-sm font-medium ${nutrientStatus.color}`}>{nutrientStatus.text}</span>
          </div>
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
  )
}
