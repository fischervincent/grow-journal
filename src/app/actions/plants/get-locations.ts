"use server";

import { auth } from "@/lib/auth";
import { getLocationRepository } from "@/lib/repositories/location-repository-factory";
import { headers } from "next/headers";

export async function getLocations() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const locationRepository = getLocationRepository();
  const locations = await locationRepository.findByUserId(session.user.id);

  return locations.map(location => ({
    id: location.id,
    name: location.name,
  }));
} 