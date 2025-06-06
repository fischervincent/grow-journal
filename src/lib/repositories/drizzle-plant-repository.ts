import { and, eq, isNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { plants, plantPhotos } from "../postgres-drizzle/schema/plant-schema";
import type { PlantRepository } from "../../core/repositories/plant-repository";
import { Plant, PlantPhoto, PlantWithId, PlantWithPhotoAndId } from "@/core/domain/plant";
import { LastDateByEventTypes } from "@/core/domain/plant-event-type";

const mapPlantFromDB = (plantInDB: typeof plants.$inferSelect): PlantWithId => {
  return {
    id: plantInDB.id,
    name: plantInDB.name,
    species: plantInDB.species || undefined,
    location: plantInDB.location || undefined,
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

const mapPlantWithPhotosFromDB = (plant: typeof plants.$inferSelect, photo: typeof plantPhotos.$inferSelect | null): PlantWithPhotoAndId => {
  return {
    ...mapPlantFromDB(plant),
    mainPhotoUrl: photo?.url,
  };
};

export class DrizzlePlantRepository implements PlantRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  async create(plant: Plant, userId: string) {
    const [createdPlant] = await this.db.insert(plants)
      .values({ ...plant, userId })
      .returning();
    return mapPlantFromDB(createdPlant);
  }

  async findById(id: string, userId: string) {
    const [plantsAndPhotos] = await this.db.select()
      .from(plants)
      .where(and(
        eq(plants.id, id),
        eq(plants.userId, userId),
      ))
      .leftJoin(plantPhotos, eq(plants.mainPhotoId, plantPhotos.id))
      .limit(1);
    return plantsAndPhotos ? mapPlantWithPhotosFromDB(plantsAndPhotos.plants, plantsAndPhotos.plant_photos) : null;
  }

  async findByUserId(userId: string) {
    const plantsInDB = await this.db.select()
      .from(plants)
      .where(and(
        eq(plants.userId, userId),
        isNull(plants.deletedAt)
      ))
      .leftJoin(plantPhotos, eq(plants.mainPhotoId, plantPhotos.id))
      .orderBy(plants.createdAt);
    return plantsInDB.map(({ plants, plant_photos }) => mapPlantWithPhotosFromDB(plants, plant_photos));
  }

  async findBySlugAndUserId(slug: string, userId: string) {
    const [plantsAndPhotos] = await this.db.select()
      .from(plants)
      .where(and(
        eq(plants.slug, slug),
        eq(plants.userId, userId)
      ))
      .leftJoin(plantPhotos, eq(plants.mainPhotoId, plantPhotos.id))
      .limit(1);
    return plantsAndPhotos ? mapPlantWithPhotosFromDB(plantsAndPhotos.plants, plantsAndPhotos.plant_photos) : null;
  }

  async update(id: string, userId: string, plant: Partial<Plant>) {
    const [updatedPlant] = await this.db.update(plants)
      .set({ ...plant, updatedAt: new Date() })
      .where(and(
        eq(plants.id, id),
        eq(plants.userId, userId),
        isNull(plants.deletedAt)
      ))
      .returning();
    return mapPlantFromDB(updatedPlant);
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