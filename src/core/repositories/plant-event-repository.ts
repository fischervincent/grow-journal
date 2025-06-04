import { PlantEventType, PlantEventTypeWithId } from "../domain/plant-event-type";
import { PlantEvent, PlantEventWithId } from "../domain/plant-event";

export interface PlantEventTypeRepository {
  findById(id: string, userId: string): Promise<PlantEventTypeWithId>;
  create(event: PlantEventType, userId: string): Promise<PlantEventTypeWithId>;
  findQuickAccessEventTypesByUserId(userId: string): Promise<PlantEventTypeWithId[]>;
  findSortableEventTypesByUserId(userId: string): Promise<PlantEventTypeWithId[]>;
  findByUserId(userId: string): Promise<PlantEventTypeWithId[]>;
  update(id: string, event: Partial<PlantEventType>): Promise<PlantEventTypeWithId>;
  delete(id: string, userId: string): Promise<void>;
}

export interface PlantEventRepository {
  create(plantEvent: PlantEvent, userId: string): Promise<PlantEventWithId>;
  findByPlantId(plantId: string, userId: string): Promise<PlantEventWithId[]>;
  findByPlantIdAndType(plantId: string, plantEventTypeId: string, userId: string): Promise<PlantEventWithId[]>;
} 