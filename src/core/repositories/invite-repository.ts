import type { Invite, NewInvite, UpdateInvite } from "../domain/invite";

export interface InviteRepository {
  findByEmail(email: string): Promise<Invite | null>;
  findAll(): Promise<Invite[]>;
  create(invite: NewInvite): Promise<Invite>;
  update(email: string, updates: UpdateInvite): Promise<Invite>;
  delete(email: string): Promise<void>;
  isEmailInvited(email: string): Promise<boolean>;
  markAsUsed(email: string): Promise<void>;
} 