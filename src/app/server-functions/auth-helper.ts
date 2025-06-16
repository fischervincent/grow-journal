import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAuthenticatedUserId() {
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
