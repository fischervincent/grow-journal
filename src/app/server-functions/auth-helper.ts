import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getInviteRepository } from "@/lib/repositories/invite-repository-factory";
import { db } from "@/lib/postgres-drizzle/database";
import { users } from "@/lib/postgres-drizzle/schema/auth-schema";
import { eq } from "drizzle-orm";

// Custom error for not invited users
export class NotInvitedError extends Error {
  constructor() {
    super('User is not invited');
    this.name = 'NotInvitedError';
  }
}

// Custom error for non-admin users
export class NotAdminError extends Error {
  constructor() {
    super('User is not an admin');
    this.name = 'NotAdminError';
  }
}

export async function getAuthenticatedUserId() {
  "use server"
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Check if user is invited
  if (userEmail) {
    try {
      const inviteRepository = getInviteRepository();
      const isInvited = await inviteRepository.isEmailInvited(userEmail);

      if (!isInvited) {
        throw new NotInvitedError();
      }
    } catch (error) {
      if (error instanceof NotInvitedError) {
        throw error; // Re-throw NotInvitedError
      }
      console.error('Error checking invite status:', error);
      // On error, throw NotInvitedError to be safe
      throw new NotInvitedError();
    }
  }

  return userId;
}

// Helper function to check if user is invited without throwing
export async function checkUserInviteStatus(): Promise<{
  isAuthenticated: boolean;
  isInvited: boolean;
  userId?: string;
  userEmail?: string;
}> {
  "use server"
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return { isAuthenticated: false, isInvited: false };
    }

    if (!session.user.email) {
      return {
        isAuthenticated: true,
        isInvited: true, // If no email, assume invited to avoid issues
        userId: session.user.id
      };
    }

    const inviteRepository = getInviteRepository();
    const isInvited = await inviteRepository.isEmailInvited(session.user.email);

    return {
      isAuthenticated: true,
      isInvited,
      userId: session.user.id,
      userEmail: session.user.email
    };
  } catch (error) {
    console.error('Error checking user invite status:', error);
    return { isAuthenticated: false, isInvited: false };
  }
}

// Check if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  "use server"
  try {
    const user = await db.select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user[0]?.isAdmin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get authenticated user ID with admin check
export async function getAuthenticatedAdminUserId() {
  "use server"
  const userId = await getAuthenticatedUserId();

  const isAdmin = await isUserAdmin(userId);
  if (!isAdmin) {
    throw new NotAdminError();
  }

  return userId;
}

// Helper function to check if current user is admin without throwing
export async function checkCurrentUserAdminStatus(): Promise<{
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId?: string;
}> {
  "use server"
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return { isAuthenticated: false, isAdmin: false };
    }

    const isAdmin = await isUserAdmin(session.user.id);

    return {
      isAuthenticated: true,
      isAdmin,
      userId: session.user.id
    };
  } catch (error) {
    console.error('Error checking current user admin status:', error);
    return { isAuthenticated: false, isAdmin: false };
  }
}

// Get user ID without invite check (for use in not-invited page, etc.)
export async function getAuthenticatedUserIdNoInviteCheck() {
  "use server"
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}

// Get session without invite check (for use in not-invited page, etc.)
export async function getSessionNoInviteCheck() {
  "use server"
  return await auth.api.getSession({
    headers: await headers()
  });
}
