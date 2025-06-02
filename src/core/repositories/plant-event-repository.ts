import { PlantEventType, PlantEventTypeWithId } from "../domain/plant-event-type";

export interface PlantEventTypeRepository {
  create(event: PlantEventType, userId: string): Promise<PlantEventTypeWithId>;
  findQuickAccessEventTypesByUserId(userId: string): Promise<PlantEventTypeWithId[]>;
  findSortableEventTypesByUserId(userId: string): Promise<PlantEventTypeWithId[]>;
  findByUserId(userId: string): Promise<PlantEventTypeWithId[]>;
  update(id: string, event: Partial<PlantEventType>): Promise<PlantEventTypeWithId>;
  delete(id: string): Promise<void>;
} 