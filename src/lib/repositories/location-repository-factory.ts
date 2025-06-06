import { LocationRepository } from "@/core/repositories/location-repository";
import { DrizzleLocationRepository } from "./drizzle-location-repository";

let repository: LocationRepository | null = null;

export function getLocationRepository(): LocationRepository {
  if (!repository) {
    repository = new DrizzleLocationRepository();
  }
  return repository;
} 