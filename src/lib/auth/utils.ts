import { createClient } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/auth/server";

export async function getUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("Authentication required.");
  }
  return user;
}
