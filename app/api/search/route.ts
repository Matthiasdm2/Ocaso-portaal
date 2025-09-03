import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const catId = searchParams.get("catId") || "";
  const subId = searchParams.get("subId") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
  const priceMin = Number(searchParams.get("priceMin") || "0");
  const priceMax = Number(searchParams.get("priceMax") || "0");
  const state = searchParams.get("state") || "";
  const location = searchParams.get("location") || "";
  const sort = searchParams.get("sort") || "";

  let query = supabase.from("listings").select("*, listing_number");
  // Toon alleen actieve zoekertjes
  query = query.eq("status", "active");
  // Filter op categorie-array
  if (catId && subId) {
    query = query.contains("categories", [catId, subId]);
  } else if (catId) {
    query = query.contains("categories", [catId]);
  }
  if (q) query = query.ilike("title", `%${q}%`);
  if (priceMin > 0) query = query.gte("price", priceMin);
  if (priceMax > 0) query = query.lte("price", priceMax);
  if (state) query = query.eq("state", state);
  if (location) query = query.ilike("location", `%${location}%`);
  // Sorting
  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else if (sort === "date_desc") query = query.order("created_at", { ascending: false });

  // Pagination
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;
  // Debug: log alle opgehaalde zoekertjes en query params
  console.log("[API/search] Query params:", { catId, subId, q, page, limit, priceMin, priceMax, state, location, sort });
  console.log("[API/search] Result count:", data?.length ?? 0);
  if (data && data.length > 0) {
    console.log("[API/search] Eerste zoekertje:", data[0]);
  }
  if (error) {
    console.error("[API/search] Supabase error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    results: data,
    total: count ?? data.length,
    page,
    limit,
  });
}

