import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { invites } from "../postgres-drizzle/schema/invite-schema";
import type {
  InviteRepository,
} from "../../core/repositories/invite-repository";
import { v4 as uuid } from "uuid";
import { Invite, NewInvite, UpdateInvite } from "@/core/domain/invite";

export class DrizzleInviteRepository implements InviteRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  async findByEmail(email: string): Promise<Invite | null> {
    const [result] = await this.db
      .select()
      .from(invites)
      .where(eq(invites.email, email))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      email: result.email,
      invitedBy: result.invitedBy ?? undefined,
      isUsed: result.isUsed,
      usedAt: result.usedAt ?? undefined,
      expiresAt: result.expiresAt ?? undefined,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async findAll(): Promise<Invite[]> {
    const results = await this.db
      .select()
      .from(invites)
      .orderBy(invites.createdAt);

    return results.map(result => ({
      id: result.id,
      email: result.email,
      invitedBy: result.invitedBy ?? undefined,
      isUsed: result.isUsed,
      usedAt: result.usedAt ?? undefined,
      expiresAt: result.expiresAt ?? undefined,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }

  async create(invite: NewInvite): Promise<Invite> {
    const [created] = await this.db
      .insert(invites)
      .values({
        id: uuid(),
        email: invite.email,
        invitedBy: invite.invitedBy,
        expiresAt: invite.expiresAt,
      })
      .returning();

    return {
      id: created.id,
      email: created.email,
      invitedBy: created.invitedBy ?? undefined,
      isUsed: created.isUsed,
      usedAt: created.usedAt ?? undefined,
      expiresAt: created.expiresAt ?? undefined,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(email: string, updates: UpdateInvite): Promise<Invite> {
    const [updated] = await this.db
      .update(invites)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(invites.email, email))
      .returning();

    if (!updated) {
      throw new Error('Invite not found');
    }

    return {
      id: updated.id,
      email: updated.email,
      invitedBy: updated.invitedBy ?? undefined,
      isUsed: updated.isUsed,
      usedAt: updated.usedAt ?? undefined,
      expiresAt: updated.expiresAt ?? undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async delete(email: string): Promise<void> {
    await this.db
      .delete(invites)
      .where(eq(invites.email, email));
  }

  async isEmailInvited(email: string): Promise<boolean> {
    const [result] = await this.db
      .select({ email: invites.email })
      .from(invites)
      .where(eq(invites.email, email))
      .limit(1);

    return !!result;
  }

  async markAsUsed(email: string): Promise<void> {
    await this.db
      .update(invites)
      .set({
        isUsed: true,
        usedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invites.email, email));
  }
} 