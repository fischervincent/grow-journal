import { z } from "zod";

export type PlantEventType = {
  name: string;
  isSortableByDate: boolean;
  hasQuickAccessButton: boolean;
  hasComment: boolean;
  displayColor: string;
};
export type PlantEventTypeWithId = PlantEventType & {
  id: string;
};

export type LastDateByEventTypes = {
  [eventId: string]: {
    lastDate: string;
    eventName: string;
  };
};

export const SUGGESTED_EVENTS = [
  { name: "Watered", displayColor: "#3b82f6" },
  { name: "Fertilized", displayColor: "#22c55e" },
  { name: "Pruned", displayColor: "#ef4444" },
  { name: "Repotted", displayColor: "#f59e0b" },
  { name: "Cleaned leaves", displayColor: "#06b6d4" },
  { name: "Rotated plant", displayColor: "#8b5cf6" },
  { name: "Harvested", displayColor: "#ec4899" },
  { name: "Health check-up", displayColor: "#14b8a6" },
] as const;

const PLANT_EVENT_TYPE_ERRORS = {
  EmptyName: "EmptyName",
  NameTooLong: "NameTooLong",
  InvalidColor: "InvalidColor",
  UnknownError: "UnknownError",
} as const;

export type PlantEventTypeError = typeof PLANT_EVENT_TYPE_ERRORS[keyof typeof PLANT_EVENT_TYPE_ERRORS];

const MAX_NAME_LENGTH = 100;

export const NewPlantEventSchema = z.object({
  name: z.string()
    .min(1, { message: PLANT_EVENT_TYPE_ERRORS.EmptyName })
    .max(MAX_NAME_LENGTH, { message: PLANT_EVENT_TYPE_ERRORS.NameTooLong }),
  displayColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: PLANT_EVENT_TYPE_ERRORS.InvalidColor }),
  isSortableByDate: z.boolean(),
  hasQuickAccessButton: z.boolean(),
  hasComment: z.boolean(),
});

export type CreateNewPlantEventTypeResult = [PlantEventType, undefined] | [null, PlantEventTypeError[]];

export type CreateNewPlantEventInput = {
  name: string;
  displayColor: string;
  isSortableByDate: boolean;
  hasQuickAccessButton: boolean;
}

export const createNewPlantEventType = (input: CreateNewPlantEventInput): CreateNewPlantEventTypeResult => {
  const parseResult = NewPlantEventSchema.safeParse(input);
  if (!parseResult.success) {
    const errors: PlantEventTypeError[] = [];

    for (const err of parseResult.error.errors) {
      const message = err.message as PlantEventTypeError;
      if (Object.values(PLANT_EVENT_TYPE_ERRORS).includes(message)) {
        errors.push(message);
      } else {
        console.error("Unknown error at domain New Plant Event Creation", err.message);
        errors.push(PLANT_EVENT_TYPE_ERRORS.UnknownError);
      }
    }
    return [null, errors];
  }

  return [
    {
      name: parseResult.data.name,
      isSortableByDate: parseResult.data.isSortableByDate,
      hasQuickAccessButton: parseResult.data.hasQuickAccessButton,
      hasComment: parseResult.data.hasComment,
      displayColor: parseResult.data.displayColor,
    },
    undefined,
  ];
}; 