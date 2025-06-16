# Guidelines for AI

We use nextjs 15 with server functions. Better-auth for auth. Shadcn for UI components. Drizzle and postgres for database. Zod for type checking.

## Guidelines
Use clean architecture with:
- `/src/core/domain` – domain logic, domain types
- `/src/core/use-cases` - use cases
- `/src/core/repositories` - interface for repositories
- `/src/lib/repositories` - adaptaters for repositories (eg. drizzle-plant-repository.ts) and repository factories (eg. plant-repository-factory) 
- `/src/lib/schema` - drizzle schemas
- `/src/app/server-functions` - server actions and server functions to get or mutate the data
- `/src/components` - components to use and reuse
- `/src/components/ui` - pure UI components (mainly from shadcn)
- `/app` - pages and page specific components
- `/app/(protected)` - for pages that are auth protected
...

### DO's & DON'T's
- Avoid using useEffect, use a server function to fetch data instead of useEffect
- Avoid mixing different layers. For example if we need to fetch data for a page, create a component that does the fetching and feed the data in another component that will handle the UI.
- In server actions and use cases, use Tuple-based Result Pattern to explicitly return the errors

## Server action example
```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createNewPlant } from "@/core/domain/plant";
import { addNewPlantUseCase } from "@/core/use-cases/add-new-plant";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";

interface SubmitPlantFormInput {
  name: string;
  species: string | undefined;
  locationId: string | undefined;
}

export async function submitPlantForm(input: SubmitPlantFormInput) {
  "use server"
  const userId = getAuthenticatedUserId();

const plantRepository = getPlantRepository();
  const { addUserPlant } = addUserPlantUseCase(plantRepository);
  const newPlantCreationResult = await addUserPlant({
    name: plant.name,
    species: plant.species,
    locationId: input.locationId,
  }, userId);

  return newPlantCreationResult // [plantCreated, specificErrors]
}
```
