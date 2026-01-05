import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import {
  getInventoryItems,
  createInventoryItem,
  searchInventoryItems,
} from "@/lib/actions/inventory.actions";

// Helper to verify admin/pharmacist/doctor session
async function verifyInventoryAccess() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  const { data: session, error } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !session) {
    return null;
  }

  if (!["admin", "pharmacist", "doctor"].includes(session.user.role)) {
    return null;
  }

  return session.user;
}

// GET /api/inventory/items - Get all inventory items with filtering
export async function GET(request) {
  try {
    const user = await verifyInventoryAccess();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const supplierId = searchParams.get("supplierId");
    const itemType = searchParams.get("itemType");
    const isActive = searchParams.get("isActive");
    const lowStock = searchParams.get("lowStock") === "true";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    // Use search function if search term provided
    if (search) {
      const result = await searchInventoryItems(search, {
        categoryId,
        itemType,
        limit,
      });
      return NextResponse.json(result);
    }

    // Otherwise use regular list function
    const result = await getInventoryItems({
      categoryId,
      supplierId,
      itemType,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
      lowStock,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory items" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/items - Create a new inventory item
export async function POST(request) {
  try {
    const user = await verifyInventoryAccess();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and pharmacist can create items
    if (!["admin", "pharmacist"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = await createInventoryItem(body, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
