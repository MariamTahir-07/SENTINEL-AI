import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { createClient, isSupabaseConfigured } from "@/lib/auth/server";
import { createApiErrorResponse, Errors } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      throw Errors.configuration("Authentication is not configured. Add Supabase credentials to the environment.");
    }

    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      const msg = issues.length > 0 ? String(issues[0].message) : "Invalid input.";
      throw Errors.validation(msg);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      throw Errors.auth("Invalid email or password.");
    }

    return NextResponse.json({ user: data.user });
  } catch (error) {
    const response = createApiErrorResponse(error);
    const status = error instanceof Error && "statusCode" in error ? (error as { statusCode: number }).statusCode : 500;
    return NextResponse.json(response, { status });
  }
}
