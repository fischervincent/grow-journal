"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlantEventType } from "@/core/domain/plant-event-type";
import { PlantEventWithId } from "@/core/domain/plant-event";
import { getPlantEvents } from "@/app/actions/plants/get-plant-events";
import {
  format,
  subMonths,
  isWithinInterval,
  eachDayOfInterval,
} from "date-fns";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PlantEventsAsTimelineProps {
  plantId: string;
  eventTypes: (PlantEventType & { id: string })[];
}

const ALL_EVENTS = "all";
const TIME_RANGES = {
  "1M": 1,
  "3M": 3,
  "6M": 6,
  "1Y": 12,
} as const;

type TimeRange = keyof typeof TIME_RANGES;

interface TimelineEvent {
  id: string;
  type: string;
  color: string;
  comment?: string;
  datetime: string;
}

interface TimelineDataPoint {
  date: number;
  y: number;
  events: TimelineEvent[];
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: TimelineDataPoint;
  value?: number;
  index?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TimelineDataPoint }>;
}

export function PlantEventsAsTimeline({
  plantId,
  eventTypes,
}: PlantEventsAsTimelineProps) {
  const [selectedEventType, setSelectedEventType] =
    useState<string>(ALL_EVENTS);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("3M");
  const [plantEvents, setPlantEvents] = useState<PlantEventWithId[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const selectedEventTypeName = useMemo(() => {
    if (selectedEventType === ALL_EVENTS) return null;
    return eventTypes.find((type) => type.id === selectedEventType)?.name;
  }, [selectedEventType, eventTypes]);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      const { plantEvents, error } = await getPlantEvents(
        plantId,
        selectedEventType === ALL_EVENTS ? undefined : selectedEventType
      );
      if (error) {
        toast.error(error);
      } else {
        setPlantEvents(plantEvents);
      }
      setIsLoadingEvents(false);
    };
    loadEvents();
  }, [plantId, selectedEventType]);

  const timelineData = useMemo(() => {
    const now = new Date();
    const startDate = subMonths(now, TIME_RANGES[selectedTimeRange]);

    // Get all dates in the interval to create the timeline
    const dates = eachDayOfInterval({ start: startDate, end: now });

    // Filter events within the selected time range
    const filteredEvents = plantEvents.filter((event) =>
      isWithinInterval(new Date(event.plantEventDateTime), {
        start: startDate,
        end: now,
      })
    );

    // Create the timeline data
    return dates.map((date) => {
      const eventsOnDate = filteredEvents.filter(
        (event) =>
          format(new Date(event.plantEventDateTime), "yyyy-MM-dd") ===
          format(date, "yyyy-MM-dd")
      );

      return {
        date: date.getTime(),
        y: 0, // Fixed Y value near the bottom
        events: eventsOnDate.map((event) => {
          const eventType = eventTypes.find(
            (type) => type.id === event.plantEventTypeId
          );
          return {
            id: event.id,
            type: eventType?.name || "Unknown",
            color: eventType?.displayColor || "#666",
            comment: event.comment,
            datetime: event.plantEventDateTime,
          };
        }),
      };
    });
  }, [plantEvents, selectedTimeRange, eventTypes]);

  const CustomDot = ({ cx, cy, payload }: CustomDotProps) => {
    if (
      !cx ||
      !cy ||
      !payload ||
      !payload.events ||
      payload.events.length === 0
    )
      return null;

    return (
      <g>
        {payload.events.map((event, index) => (
          <circle
            key={event.id}
            cx={cx}
            cy={cy - index * 12} // Increased spacing between stacked events
            r={5}
            fill={event.color}
            stroke="white"
            strokeWidth={2}
          />
        ))}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload[0]) {
      const { events } = payload[0].payload;
      if (!events || events.length === 0) return null;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
          <p className="text-lg font-semibold mb-2">
            {format(events[0].datetime, "MMMM d, yyyy")}
          </p>
          <div className="space-y-3">
            {events.map((event: TimelineEvent) => (
              <div key={event.id} className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div>
                  <p className="font-medium text-base">{event.type}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(event.datetime), "h:mm a")}
                  </p>
                  {event.comment && (
                    <p className="text-sm text-gray-600 mt-1">
                      {event.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const getEmptyStateMessage = () => {
    const timeRange = TIME_RANGES[selectedTimeRange];
    const period =
      timeRange === 1
        ? "month"
        : timeRange === 12
        ? "year"
        : `${timeRange} months`;

    return selectedEventTypeName
      ? `No ${selectedEventTypeName.toLowerCase()} events in the last ${period}`
      : `No events recorded in the last ${period}`;
  };

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Care Timeline</h2>
          <div className="flex gap-2">
            <Select
              value={selectedTimeRange}
              onValueChange={(value: TimeRange) => setSelectedTimeRange(value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIME_RANGES).map(([key]) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedEventType}
              onValueChange={setSelectedEventType}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_EVENTS}>All events</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingEvents ? (
          <div className="text-center py-8 text-gray-500">
            Loading events...
          </div>
        ) : timelineData.length === 0 ||
          !timelineData.some((data) => data.events.length > 0) ? (
          <div className="text-center py-8 text-gray-500">
            {getEmptyStateMessage()}
          </div>
        ) : (
          <div className="h-[100px] w-full mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 20, right: 30, left: 30, bottom: 25 }}
              >
                <YAxis type="number" domain={[0, 0.2]} hide={true} />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(timestamp) => format(timestamp, "MMM d")}
                  height={35}
                  tickMargin={5}
                  axisLine={{ strokeWidth: 1, stroke: "#e5e7eb" }}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  position={{ y: -70 }}
                  wrapperStyle={{ outline: "none" }}
                />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#e5e7eb"
                  dot={<CustomDot />}
                  activeDot={false}
                  isAnimationActive={false}
                  yAxisId={0}
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
