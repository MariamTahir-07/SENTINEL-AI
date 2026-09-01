import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/auth/server";
import { createApiErrorResponse, Errors } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      throw Errors.configuration("Authentication is not configured.");
    }

    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    const response = createApiErrorResponse(error);
    return NextResponse.json(response, { status: 500 });
  }
}
