export interface PlantEvent {
  plantEventDateTime: Date;
  comment?: string;
  plantEventTypeId: string;
  plantId: string;
}

export interface PlantEventWithId extends PlantEvent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
} 