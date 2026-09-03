import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { signupSchema } from "@/lib/validation";
import { createClient, isSupabaseConfigured } from "@/lib/auth/server";
import { createApiErrorResponse, Errors } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      throw Errors.configuration("Authentication is not configured. Add Supabase credentials to the environment.");
    }

    const body = await request.json();
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      const msg = issues.length > 0 ? String(issues[0].message) : "Invalid input.";
      throw Errors.validation(msg);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        data: {
          full_name: validation.data.fullName,
          preferred_language: validation.data.preferredLanguage,
        },
      },
    });

    if (error) {
      throw Errors.auth(error.message);
    }

    // Auto-confirm email so the user can log in immediately.
    // Requires SUPABASE_SERVICE_ROLE_KEY in the environment.
    if (data.user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        data.user.id,
        { email_confirm: true }
      );
      if (confirmError) {
        console.error("[signup] Failed to auto-confirm email:", confirmError.message);
        // Non-fatal — user was created but must confirm email manually
      }
    } else if (data.user && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "[signup] SUPABASE_SERVICE_ROLE_KEY is not set. Email auto-confirmation is disabled. " +
        "The user must confirm their email before logging in. " +
        "To fix: add SUPABASE_SERVICE_ROLE_KEY to .env.local or disable email confirmation in the Supabase Dashboard."
      );
    }

    return NextResponse.json({ user: data.user });
  } catch (error) {
    const response = createApiErrorResponse(error);
    const status = error instanceof Error && "statusCode" in error ? (error as { statusCode: number }).statusCode : 500;
    return NextResponse.json(response, { status });
  }
}
