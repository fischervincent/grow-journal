import { z } from "zod";

// Helper function to generate a URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export type Plant = {
  name: string;
  slug: string;
  species: string | undefined;
  location: string | undefined;
}

export type PlantWithId = Plant & {
  id: string;
}

const PLANT_CREATION_ERRORS = {
  EmptyName: "EmptyName",
  NameTooLong: "NameTooLong",
  EmptySpecies: "EmptySpecies",
  SpeciesTooLong: "SpeciesTooLong",
  UnknownError: "UnknownError",
} as const;
type PlantCreationError = typeof PLANT_CREATION_ERRORS[keyof typeof PLANT_CREATION_ERRORS];

const MAX_NAME_LENGTH = 100;
export const NewPlantSchema = z.object({
  name: z.string()
    .min(1, { message: PLANT_CREATION_ERRORS.EmptyName })
    .max(MAX_NAME_LENGTH, { message: PLANT_CREATION_ERRORS.NameTooLong }),
  speciesName: z.string()
    .min(1, { message: PLANT_CREATION_ERRORS.EmptySpecies })
    .max(MAX_NAME_LENGTH, { message: PLANT_CREATION_ERRORS.SpeciesTooLong })
    .optional()
})

type CreateNewPlantResult = [Plant, undefined] | [null, PlantCreationError[]]

export const createNewPlant = (newPlantInput: {
  name: string;
  species: string | undefined;
  location: string | undefined;
}): CreateNewPlantResult => {
  const parseResult = NewPlantSchema.safeParse(newPlantInput)
  if (!parseResult.success) {
    const errors: PlantCreationError[] = []

    for (const err of parseResult.error.errors) {
      const message = err.message as PlantCreationError
      if (Object.values(PLANT_CREATION_ERRORS).includes(message)) {
        errors.push(message)
      } else {
        console.log("Unknown error at domain New Plant Creation", err.message)
        errors.push(PLANT_CREATION_ERRORS.UnknownError)
      }
    }
    return [null, errors]
  }
  return [
    {
      name: parseResult.data.name,
      slug: generateSlug(parseResult.data.name),
      species: parseResult.data.speciesName,
      location: newPlantInput.location,
    },
    undefined,
  ]
}
