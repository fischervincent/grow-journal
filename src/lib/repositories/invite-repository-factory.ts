import { DrizzleInviteRepository } from "./drizzle-invite-repository";
import { db } from "../postgres-drizzle/database";
import type { InviteRepository } from "../../core/repositories/invite-repository";

export function getInviteRepository(): InviteRepository {
  return new DrizzleInviteRepository(db);
}
