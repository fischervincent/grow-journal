import { Plant, PlantPhoto, PlantWithId, PlantWithPhotoAndId } from "../domain/plant";

export interface PlantRepository {
  create(plant: Plant, userId: string): Promise<PlantWithId>;
  findById(id: string, userId: string): Promise<PlantWithPhotoAndId | null>;
  findByUserId(userId: string): Promise<PlantWithPhotoAndId[]>;
  findBySlugAndUserId(slug: string, userId: string): Promise<PlantWithPhotoAndId | null>;
  update(id: string, userId: string, plant: Partial<Plant>): Promise<PlantWithId>;
  delete(id: string, userId: string): Promise<PlantWithId>;
  removeEventType(userId: string, eventTypeId: string): Promise<void>;

  // Photo related methods
  addPhoto(plantPhoto: { plantId: string, userId: string, url: string, takenAt?: Date }): Promise<PlantPhoto>;
  getPhotos(plantId: string, userId: string): Promise<PlantPhoto[]>;
  setMainPhoto(plantId: string, userId: string, photoId: string): Promise<PlantWithId>;
  deletePhoto(photoId: string, userId: string): Promise<void>;
} 