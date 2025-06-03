"use client";

import type React from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LastDateByEventTypes,
  PlantEventType,
} from "@/core/domain/plant-event-type";

interface PlantCardProps {
  slug: string;
  name: string;
  species?: string;
  image: string;
  location?: string;
  lastDateByEvents: LastDateByEventTypes;
  quickAccessEvents: PlantEventType[];
  onEventClick: (eventId: string) => void;
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
  return (
    <Card className="overflow-hidden pt-0 h-full">
      <Link href={`/plants/${slug}`}>
        <div className="relative aspect-square">
          <Image src={image} alt={name} fill className="object-cover" />
        </div>
      </Link>

      <CardContent className="px-4 flex-1">
        <Link href={`/plants/${slug}`} className="hover:underline">
          <h3 className="font-semibold text-lg">{name}</h3>
        </Link>
        {species && <p className="text-sm text-muted-foreground">{species}</p>}
        {location && (
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 pt-0 flex gap-2 flex-wrap">
        {quickAccessEvents.map((event) => {
          const lastEvent = lastDateByEvents[event.id];
          return (
            <Button
              key={event.id}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              style={{
                borderColor: event.displayColor,
                color: event.displayColor,
              }}
              onClick={() => onEventClick(event.id)}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: event.displayColor }}
              />
              <span>{event.name}</span>
              {lastEvent && (
                <span className="text-xs text-muted-foreground">
                  {new Date(lastEvent.lastDate).toLocaleDateString()}
                </span>
              )}
            </Button>
          );
        })}
      </CardFooter>
    </Card>
  );
}
