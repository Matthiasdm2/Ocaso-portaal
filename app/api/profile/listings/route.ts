// app/api/profile/listings/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface Listing {
  id: string;
  title?: string;
  price?: number | string;
  images?: string[];
  created_at: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    50,
    Math.max(1, Number(searchParams.get("limit") ?? "20")),
  );
  // const offset = (page - 1) * limit;

  // Supabase client met cookies (zodat auth werkt)
  const supabase = createRouteHandlerClient({ cookies });

  // 1) seller_id uit query gebruiken (client stuurt deze mee)
  //    zo niet aanwezig: terugvallen op ingelogde user
  let sellerId = searchParams.get("seller_id") ?? undefined;
  if (!sellerId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    sellerId = user?.id;
  }

  if (!sellerId) {
    // Geen id bekend → leeg resultaat i.p.v. error
    return NextResponse.json(
      { items: [], page, limit, total: 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, count, error } = await supabase
    .from("listings")
    .select("id,title,price,images,created_at", { count: "exact" })
    .eq("seller_id", sellerId);

  if (error) {
    return NextResponse.json(
      { items: [], page, limit, total: 0, error: error.message },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      items: (data ?? []).map((l: Listing) => ({
        id: l.id,
        title: l.title ?? "",
        price: Number(l.price ?? 0),
        thumb: Array.isArray(l.images) && l.images[0] ? l.images[0] : null,
        created_at: l.created_at,
      })),
      page,
      limit,
      total: count ?? 0,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
