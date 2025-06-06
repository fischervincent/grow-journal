export interface Location {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationRepository {
  findByUserId(userId: string): Promise<Location[]>;
  create(location: { name: string; userId: string }): Promise<Location>;
  update(id: string, data: { name: string }): Promise<Location>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Location | null>;
} 