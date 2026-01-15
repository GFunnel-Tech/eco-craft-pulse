import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LightspeedWebhookPayload {
  eventId: string;
  eventCreated: number;
  eventType: string;
  storeId: number;
  entityId: number;
  data: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload: LightspeedWebhookPayload = await req.json();
    console.log("Received webhook:", payload.eventType, payload.entityId);

    // Log the incoming event
    const { data: logEntry, error: logError } = await supabase
      .from("sync_logs")
      .insert({
        event_type: payload.eventType,
        source: "lightspeed",
        entity_id: String(payload.entityId),
        status: "pending",
        payload: payload,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging webhook:", logError);
    }

    let localId: string | null = null;
    let errorMessage: string | null = null;
    let status = "success";

    try {
      switch (payload.eventType) {
        case "order.created":
        case "order.updated":
          localId = await handleOrderEvent(supabase, payload);
          break;

        case "product.created":
        case "product.updated":
          localId = await handleProductEvent(supabase, payload);
          break;

        case "product.deleted":
          await handleProductDeleted(supabase, payload);
          break;

        case "order.deleted":
          await handleOrderDeleted(supabase, payload);
          break;

        default:
          console.log("Unhandled event type:", payload.eventType);
      }
    } catch (err) {
      console.error("Error processing webhook:", err);
      status = "failed";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    // Update log entry with result
    if (logEntry) {
      await supabase
        .from("sync_logs")
        .update({
          status,
          local_id: localId,
          error_message: errorMessage,
          processed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    return new Response(
      JSON.stringify({ 
        success: status === "success", 
        eventType: payload.eventType,
        entityId: payload.entityId,
        localId 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: status === "success" ? 200 : 500
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Invalid webhook payload" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});

// Handle order created/updated events
async function handleOrderEvent(
  supabase: SupabaseClient,
  payload: LightspeedWebhookPayload
): Promise<string | null> {
  const orderData = payload.data as {
    id: string;
    orderNumber: number;
    email: string;
    total: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    items?: Array<{
      productId: number;
      sku: string;
      name: string;
      quantity: number;
      price: number;
    }>;
    shippingAddress?: Record<string, unknown>;
    billingAddress?: Record<string, unknown>;
  };

  // Map Lightspeed status to our order_status enum
  const statusMap: Record<string, string> = {
    "AWAITING_PROCESSING": "pending",
    "PROCESSING": "processing",
    "SHIPPED": "shipped",
    "DELIVERED": "delivered",
    "CANCELLED": "cancelled",
    "RETURNED": "refunded",
  };

  const mappedStatus = statusMap[orderData.fulfillmentStatus] || "pending";

  // Check if order exists by lightspeed_order_id
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("lightspeed_order_id", orderData.id)
    .single();

  if (existingOrder) {
    // Update existing order
    await supabase
      .from("orders")
      .update({
        status: mappedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingOrder.id);
    
    return existingOrder.id;
  } else {
    // Create new order
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        lightspeed_order_id: orderData.id,
        email: orderData.email,
        status: mappedStatus,
        subtotal: orderData.total,
        total: orderData.total,
        shipping_address: orderData.shippingAddress,
        billing_address: orderData.billingAddress,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    if (orderData.items && orderData.items.length > 0) {
      const orderItems = orderData.items.map((item) => ({
        order_id: newOrder.id,
        product_name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      await supabase.from("order_items").insert(orderItems);
    }

    return newOrder.id;
  }
}

// Handle product created/updated events
async function handleProductEvent(
  supabase: SupabaseClient,
  payload: LightspeedWebhookPayload
): Promise<string | null> {
  const productData = payload.data as {
    id: number;
    sku: string;
    name: string;
    price: number;
    compareToPrice?: number;
    quantity: number;
    enabled: boolean;
    description?: string;
  };

  // Check if product exists by SKU
  const { data: existingProduct } = await supabase
    .from("products")
    .select("id")
    .eq("sku", productData.sku)
    .single();

  if (existingProduct) {
    // Update existing product
    await supabase
      .from("products")
      .update({
        name: productData.name,
        price: productData.price,
        compare_at_price: productData.compareToPrice,
        is_active: productData.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProduct.id);

    // Update variant stock if exists
    await supabase
      .from("product_variants")
      .update({
        stock_quantity: productData.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", existingProduct.id);

    return existingProduct.id;
  }

  // Product doesn't exist - log for manual review
  console.log("Product not found in database, SKU:", productData.sku);
  return null;
}

// Handle product deleted events
async function handleProductDeleted(
  supabase: SupabaseClient,
  payload: LightspeedWebhookPayload
): Promise<void> {
  const productData = payload.data as { sku: string };
  
  // Soft delete by setting is_active to false
  await supabase
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("sku", productData.sku);
}

// Handle order deleted events
async function handleOrderDeleted(
  supabase: SupabaseClient,
  payload: LightspeedWebhookPayload
): Promise<void> {
  const orderData = payload.data as { id: string };
  
  // Update order status to cancelled
  await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("lightspeed_order_id", orderData.id);
}
