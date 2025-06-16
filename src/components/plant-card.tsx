"use client";

import type React from "react";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { ButtonWithConfirmation } from "@/components/ui/button-with-confirmation";
import Link from "next/link";
import {
  LastDateByEventTypes,
  PlantEventTypeWithId,
} from "@/core/domain/plant-event-type";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

function formatLastDate(date: string) {
  return dayjs(date).fromNow();
}

interface PlantCardProps {
  slug: string;
  name: string;
  species?: string;
  image: string;
  location?: string;
  mainPhotoUrl?: string;
  lastDateByEvents: LastDateByEventTypes;
  quickAccessEvents: PlantEventTypeWithId[];
  onEventClick: (plantEvent: PlantEventTypeWithId) => () => Promise<void>;
}

export function PlantCard({
  slug,
  name,
  species,
  image,
  location,
  lastDateByEvents,
  quickAccessEvents,
  onEventClick,
}: PlantCardProps) {
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);

  const handleEventClick =
    (plantEventType: PlantEventTypeWithId) => async () => {
      const originalCallback = onEventClick(plantEventType);
      setUpdatingEventId(plantEventType.id);
      try {
        await originalCallback();
      } finally {
        // Reset after animation duration
        setTimeout(() => {
          setUpdatingEventId(null);
        }, 1000);
      }
    };

  return (
    <Card
      hasPaddingTop={false}
      className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 py-0 h-full"
    >
      <Link href={`/plants/${slug}`}>
        <div className="relative aspect-square">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      <CardContent className="px-4 py-0">
        <h3 className="font-semibold text-lg select-all">{name}</h3>
        {species && (
          <p className="text-sm text-muted-foreground select-all">{species}</p>
        )}
        {location && (
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 pt-0 flex flex-col mt-auto gap-2 pb-2">
        {quickAccessEvents.map((plantEventType) => (
          <div
            className="flex items-center justify-between mb-1 pb-1 w-full"
            key={plantEventType.id}
          >
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Last {plantEventType.name.toLowerCase()}
              </span>
              <span
                className={cn(
                  "text-sm font-medium transition-all duration-300",
                  updatingEventId === plantEventType.id &&
                    "text-green-600 scale-105"
                )}
              >
                {lastDateByEvents[plantEventType.id]?.lastDate
                  ? formatLastDate(
                      lastDateByEvents[plantEventType.id]?.lastDate
                    )
                  : "Never"}
              </span>
            </div>
            <ButtonWithConfirmation
              size="sm"
              variant="outline"
              style={{
                borderColor: plantEventType.displayColor,
                color: plantEventType.displayColor,
              }}
              progressColor={plantEventType.displayColor}
              className="flex items-center gap-1"
              onConfirm={handleEventClick(plantEventType)}
              dialogTitle={`Record ${plantEventType.name}`}
              dialogDescription={`Are you sure you want to record ${plantEventType.name.toLowerCase()} for ${name}?`}
              confirmText={`Record ${plantEventType.name}`}
            >
              <span>{plantEventType.name}</span>
            </ButtonWithConfirmation>
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}
