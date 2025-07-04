"use server";

import { getAuthenticatedUserId } from "./auth-helper";
import { getInviteRepository } from "@/lib/repositories/invite-repository-factory";
import type { NewInvite } from "@/core/domain/invite";

export async function createInvite(email: string, expiresAt?: Date) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getInviteRepository();

    // Check if email is already invited
    const existingInvite = await repository.findByEmail(email);
    if (existingInvite) {
      return [null, 'Email already invited'] as const;
    }

    const newInvite: NewInvite = {
      email,
      invitedBy: userId,
      expiresAt,
    };

    const invite = await repository.create(newInvite);
    return [invite, null] as const;
  } catch (error) {
    console.error('Error creating invite:', error);
    return [null, error instanceof Error ? error.message : 'Failed to create invite'] as const;
  }
}

export async function getAllInvites() {
  try {
    await getAuthenticatedUserId(); // Ensure user is authenticated
    const repository = getInviteRepository();

    const invites = await repository.findAll();
    return [invites, null] as const;
  } catch (error) {
    console.error('Error getting invites:', error);
    return [null, error instanceof Error ? error.message : 'Failed to get invites'] as const;
  }
}

export async function deleteInvite(email: string) {
  try {
    await getAuthenticatedUserId(); // Ensure user is authenticated
    const repository = getInviteRepository();

    await repository.delete(email);
    return [true, null] as const;
  } catch (error) {
    console.error('Error deleting invite:', error);
    return [null, error instanceof Error ? error.message : 'Failed to delete invite'] as const;
  }
}

export async function isEmailInvited(email: string) {
  try {
    const repository = getInviteRepository();
    const isInvited = await repository.isEmailInvited(email);
    return [isInvited, null] as const;
  } catch (error) {
    console.error('Error checking invite:', error);
    return [null, error instanceof Error ? error.message : 'Failed to check invite'] as const;
  }
} 