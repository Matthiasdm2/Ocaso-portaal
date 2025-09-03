import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(request: Request) {
  const { listingId, amount } = await request.json();
  if (!listingId || !amount) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const { data, error } = await supabase.from("bids").insert({ listing_id: listingId, amount });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, bid: data?.[0] });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("bids")
    .select("amount")
    .eq("listing_id", listingId)
    .order("amount", { ascending: false })
    .limit(1);
  const { count } = await supabase
    .from("bids")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ highest: data?.[0]?.amount ?? null, count: count ?? 0 });
}
