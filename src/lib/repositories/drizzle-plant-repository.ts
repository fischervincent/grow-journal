import { and, eq, isNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { plants, plantPhotos } from "../postgres-drizzle/schema/plant-schema";
import type { NewPlant, PlantRepository } from "../../core/repositories/plant-repository";
import { Plant, PlantPhoto, PlantWithId, PlantWithPhotoAndId } from "@/core/domain/plant";
import { LastDateByEventTypes } from "@/core/domain/plant-event-type";
import { locations } from "../postgres-drizzle/schema/location-schema";

const mapPlantFromDB = (plantInDB: typeof plants.$inferSelect): PlantWithId => {
  return {
    id: plantInDB.id,
    name: plantInDB.name,
    species: plantInDB.species || undefined,
    slug: plantInDB.slug,
    lastDateByEvents: plantInDB.lastDateByEvents as LastDateByEventTypes,
    deletedAt: plantInDB.deletedAt ?? undefined,
  };
};

const mapPhotoFromDB = (photoInDB: typeof plantPhotos.$inferSelect): PlantPhoto => {
  return {
    id: photoInDB.id,
    url: photoInDB.url,
    takenAt: photoInDB.takenAt ?? photoInDB.createdAt,
  };
};

const mapPlantWithPhotosFromDB = (
  plant: typeof plants.$inferSelect,
  photo: typeof plantPhotos.$inferSelect | null,
  location: typeof locations.$inferSelect | null
): PlantWithPhotoAndId => {
  return {
    ...mapPlantFromDB(plant),
    mainPhotoUrl: photo?.url,
    location: location?.name,
    locationId: location?.id,
  };
};

export class DrizzlePlantRepository implements PlantRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  async create(plant: NewPlant, userId: string) {
    const [createdPlant] = await this.db.insert(plants)
      .values({
        ...plant,
        userId,
        locationId: plant.locationId || null,
      })
      .returning();
    return mapPlantFromDB(createdPlant);
  }

  async findById(id: string, userId: string) {
    const [plantsAndPhotos] = await this.db.select({
      plants: plants,
      plant_photos: plantPhotos,
      locations: locations,
    })
      .from(plants)
      .where(and(
        eq(plants.id, id),
        eq(plants.userId, userId),
      ))
      .leftJoin(plantPhotos, eq(plants.mainPhotoId, plantPhotos.id))
      .leftJoin(locations, eq(plants.locationId, locations.id))
      .limit(1);

    return plantsAndPhotos ? mapPlantWithPhotosFromDB(
      plantsAndPhotos.plants,
      plantsAndPhotos.plant_photos,
      plantsAndPhotos.locations
    ) : null;
  }

  async findByUserId(userId: string) {
    const plantsInDB = await this.db.select({
      plants: plants,
      plant_photos: plantPhotos,
      locations: locations,
    })
      .from(plants)
      .where(and(
        eq(plants.userId, userId),
        isNull(plants.deletedAt)
      ))
      .leftJoin(plantPhotos, eq(plants.mainPhotoId, plantPhotos.id))
      .leftJoin(locations, eq(plants.locationId, locations.id))
      .orderBy(plants.createdAt);

    return plantsInDB.map(({ plants, plant_photos, locations }) =>
      mapPlantWithPhotosFromDB(plants, plant_photos, locations)
    );
  }

  async findBySlugAndUserId(slug: string, userId: string) {
    const [plantsAndPhotos] = await this.db.select()
      .from(plants)
      .where(and(
        eq(plants.slug, slug),
        eq(plants.userId, userId)
      ))
      .leftJoin(plantPhotos, eq(plants.mainPhotoId, plantPhotos.id))
      .leftJoin(locations, eq(plants.locationId, locations.id))
      .limit(1);
    return plantsAndPhotos ? mapPlantWithPhotosFromDB(plantsAndPhotos.plants, plantsAndPhotos.plant_photos, plantsAndPhotos.locations) : null;
  }

  async update(id: string, userId: string, plant: Partial<Plant & { locationId: string | undefined }>) {
    await this.db.update(plants)
      .set({
        ...plant,
        locationId: plant.locationId === undefined ? undefined : plant.locationId || null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(plants.id, id),
        eq(plants.userId, userId),
        isNull(plants.deletedAt)
      )).execute();

    const [updatedPlantWithJoin] = await this.db.select({
      plants: plants,
      locations: locations,
      plant_photos: plantPhotos,
    })
      .from(plants)
      .where(eq(plants.id, id))
      .leftJoin(plantPhotos, eq(plants.mainPhotoId, plantPhotos.id))
      .leftJoin(locations, eq(plants.locationId, locations.id))
      .limit(1);

    return mapPlantWithPhotosFromDB(updatedPlantWithJoin.plants, updatedPlantWithJoin.plant_photos, updatedPlantWithJoin.locations);
  }

  async delete(id: string, userId: string) {
    const [deletedPlant] = await this.db.update(plants)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(plants.id, id),
        eq(plants.userId, userId),
        isNull(plants.deletedAt)
      ))
      .returning();
    return mapPlantFromDB(deletedPlant);
  }

  async removeEventType(userId: string, eventTypeId: string) {
    await this.db.update(plants)
      .set({
        lastDateByEvents: sql`${plants.lastDateByEvents} - ${eventTypeId}`
      })
      .where(eq(plants.userId, userId));
  }

  async getPhotoById(photoId: string, userId: string): Promise<PlantPhoto | null> {
    const [photo] = await this.db.select()
      .from(plantPhotos)
      .where(and(
        eq(plantPhotos.id, photoId),
        eq(plantPhotos.userId, userId)
      ))
      .limit(1);
    return photo ? mapPhotoFromDB(photo) : null;
  }

  async addPhoto({ plantId, userId, url, takenAt }: { plantId: string, userId: string, url: string, takenAt?: Date }): Promise<PlantPhoto> {
    // First verify the plant belongs to the user
    const plant = await this.findById(plantId, userId);
    if (!plant) throw new Error("Plant not found");

    const [photo] = await this.db.insert(plantPhotos)
      .values({ plantId, userId, url, takenAt })
      .returning();

    return mapPhotoFromDB(photo);
  }

  async getPhotos(plantId: string, userId: string): Promise<PlantPhoto[]> {
    // First verify the plant belongs to the user
    const plant = await this.findById(plantId, userId);
    if (!plant) throw new Error("Plant not found");

    const photos = await this.db.select()
      .from(plantPhotos)
      .where(eq(plantPhotos.plantId, plantId))
      .orderBy(plantPhotos.takenAt);

    return photos.map(mapPhotoFromDB);
  }

  async setMainPhoto(plantId: string, userId: string, photoId: string): Promise<PlantWithId> {
    // First verify the plant belongs to the user
    const plant = await this.findById(plantId, userId);
    if (!plant) throw new Error("Plant not found");

    // Verify the photo exists and belongs to the plant
    const [photo] = await this.db.select()
      .from(plantPhotos)
      .where(and(
        eq(plantPhotos.id, photoId),
        eq(plantPhotos.plantId, plantId)
      ))
      .limit(1);
    if (!photo) throw new Error("Photo not found");

    const [updatedPlant] = await this.db.update(plants)
      .set({ mainPhotoId: photoId })
      .where(eq(plants.id, plantId))
      .returning();

    return mapPlantFromDB(updatedPlant);
  }

  async deletePhoto(photoId: string, userId: string): Promise<void> {
    // First find the photo and its associated plant
    const [photo] = await this.db.select({
      photo: plantPhotos,
      plant: plants
    })
      .from(plantPhotos)
      .innerJoin(plants, eq(plants.id, plantPhotos.plantId))
      .where(eq(plantPhotos.id, photoId))
      .limit(1);

    if (!photo || photo.plant.userId !== userId) {
      throw new Error("Photo not found");
    }

    // If this was the main photo, clear the reference
    if (photo.plant.mainPhotoId === photoId) {
      await this.db.update(plants)
        .set({ mainPhotoId: null })
        .where(eq(plants.id, photo.plant.id));
    }

    // Delete the photo
    await this.db.delete(plantPhotos)
      .where(eq(plantPhotos.id, photoId));
  }
}