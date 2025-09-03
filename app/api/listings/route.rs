// app/api/listings/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: Request) {
  try {
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase env ontbreekt" }, { status: 500 });
    }
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || "24")));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("listings")
      .select("id,title,price,images,main_photo,categories,location,state,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    // Filter: category aanwezig in JSONB array
    if (category) {
      query = query.contains("categories", [category] as any);
    }
    // Subcategorie als tweede element (ook gewoon "contains" is oké)
    if (subcategory) {
      query = query.contains("categories", [category, subcategory] as any);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      page,
      pageSize,
      total: count ?? 0,
      items: data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown" }, { status: 500 });
  }
}
