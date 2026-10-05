import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// One-time admin account bootstrap. Idempotent: refuses if the email already exists.
const ADMIN_EMAIL = "admin@gfunnel.com";
const TEMP_PASSWORD = "Password123$";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Idempotency: check if the email is already registered
    const { data: existing } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", ADMIN_EMAIL)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Account already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the auth user (email pre-confirmed so they can log in immediately)
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: TEMP_PASSWORD,
      email_confirm: true,
    });

    if (createError) {
      throw createError;
    }

    const userId = created.user.id;

    // Flag the profile to force a password change on first login
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ must_change_password: true })
      .eq("user_id", userId);

    if (profileError) {
      throw profileError;
    }

    // Grant admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    if (roleError) {
      throw roleError;
    }

    return new Response(
      JSON.stringify({ success: true, email: ADMIN_EMAIL }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
