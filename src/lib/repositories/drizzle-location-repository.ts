import { eq } from "drizzle-orm";
import { locations } from "../postgres-drizzle/schema/location-schema";
import { Location, LocationRepository } from "@/core/repositories/location-repository";
import { db } from "../postgres-drizzle/database";
import { DatabaseError } from 'pg';

const UNIQUE_VIOLATION_CODE = "23505";

export class DrizzleLocationRepository implements LocationRepository {
  async findByUserId(userId: string): Promise<Location[]> {
    const results = await db
      .select()
      .from(locations)
      .where(eq(locations.userId, userId))
      .orderBy(locations.name);

    return results.map(this.mapLocationFromDB);
  }

  async create(location: { name: string; userId: string }): Promise<Location> {
    try {
      const [result] = await db
        .insert(locations)
        .values(location)
        .returning();

      return this.mapLocationFromDB(result);
    } catch (error) {
      if (error instanceof DatabaseError && error.code === UNIQUE_VIOLATION_CODE) {
        throw new Error(`Location "${location.name}" already exists`);
      }
      throw error;
    }
  }

  async update(id: string, data: { name: string }): Promise<Location> {
    try {
      const [existingLocation] = await db
        .select()
        .from(locations)
        .where(eq(locations.id, id))
        .limit(1);

      if (!existingLocation) {
        throw new Error(`Location with id ${id} not found`);
      }

      const [result] = await db
        .update(locations)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(locations.id, id))
        .returning();

      return this.mapLocationFromDB(result);
    } catch (error) {
      if (error instanceof DatabaseError && error.code === UNIQUE_VIOLATION_CODE) {
        throw new Error(`Location "${data.name}" already exists`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  async findById(id: string): Promise<Location | null> {
    const [result] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id))
      .limit(1);

    return result ? this.mapLocationFromDB(result) : null;
  }

  private mapLocationFromDB(location: typeof locations.$inferSelect): Location {
    return {
      id: location.id,
      name: location.name,
      userId: location.userId,
      createdAt: location.createdAt ?? new Date(),
      updatedAt: location.updatedAt ?? new Date(),
    };
  }
} 