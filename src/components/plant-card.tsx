"use client";

import type React from "react";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LastDateByEventTypes,
  PlantEventTypeWithId,
} from "@/core/domain/plant-event-type";

interface PlantCardProps {
  slug: string;
  name: string;
  species?: string;
  image: string;
  location?: string;
  lastDateByEvents: LastDateByEventTypes;
  quickAccessEvents: PlantEventTypeWithId[];
  onEventClick: (plantEvent: PlantEventTypeWithId) => () => void;
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
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 py-0 h-full">
      <Link href={`/plants/${slug}`}>
        <div className="relative aspect-square">
          <Image src={image} alt={name} fill className="object-cover" />
        </div>
      </Link>

      <CardContent className="px-4 py-0">
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

      <CardFooter className="px-4 pt-0 flex flex-col mt-auto gap-2">
        {quickAccessEvents.map((plantEventType) => (
          <div
            className="flex items-center justify-between mb-1 pb-1 w-full"
            key={plantEventType.id}
          >
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Last {plantEventType.name.toLowerCase()}
              </span>
              <span className={`text-sm font-medium`}>
                {" "}
                {lastDateByEvents[plantEventType.id]?.lastDate
                  ? formatLastDate(
                      lastDateByEvents[plantEventType.id]?.lastDate
                    )
                  : "Never"}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              style={{
                borderColor: plantEventType.displayColor,
                color: plantEventType.displayColor,
              }}
              className="flex items-center gap-1"
              onClick={onEventClick(plantEventType)}
            >
              <span> {plantEventType.name}</span>
            </Button>
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}

function formatLastDate(date: string): string {
  dayjs.extend(relativeTime);
  const readable = dayjs(date).fromNow();
  return readable;
}
