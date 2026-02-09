import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KLAVIYO_API_KEY = Deno.env.get("KLAVIYO_API_KEY");
    if (!KLAVIYO_API_KEY) {
      throw new Error("KLAVIYO_API_KEY is not configured");
    }

    const KLAVIYO_LIST_ID = Deno.env.get("KLAVIYO_LIST_ID");
    if (!KLAVIYO_LIST_ID) {
      throw new Error("KLAVIYO_LIST_ID is not configured");
    }

    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Create or update the profile in Klaviyo
    const profileRes = await fetch("https://a.klaviyo.com/api/profile-import/", {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        "Content-Type": "application/json",
        "revision": "2024-10-15",
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email,
          },
        },
      }),
    });

    if (!profileRes.ok) {
      const errBody = await profileRes.text();
      console.error("Klaviyo profile-import failed:", profileRes.status, errBody);
      throw new Error(`Klaviyo profile-import failed [${profileRes.status}]`);
    }

    const profileData = await profileRes.json();
    const profileId = profileData?.data?.id;

    // Step 2: Subscribe the profile to the list
    const subscribeRes = await fetch(`https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`, {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        "Content-Type": "application/json",
        "revision": "2024-10-15",
      },
      body: JSON.stringify({
        data: [{ type: "profile", id: profileId }],
      }),
    });

    if (!subscribeRes.ok) {
      const errBody = await subscribeRes.text();
      console.error("Klaviyo list subscribe failed:", subscribeRes.status, errBody);
      // Don't throw - profile was still created
    } else {
      // Consume response body
      await subscribeRes.text();
    }

    // Also save to local DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await supabase.from("newsletter_subscribers").upsert(
      { email },
      { onConflict: "email" }
    );

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
