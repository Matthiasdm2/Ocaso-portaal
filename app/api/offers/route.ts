// app/api/offers/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// If 'createClient' is the default export:
import createClient from "@/lib/supabaseServer"; // maak een server client die auth via cookies gebruikt

// Or, if the actual exported member is named differently, e.g. 'supabaseServerClient':
// import { supabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { listingId, amount } = await req.json();
    if (!listingId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createClient(cookieStore); // in jouw project: lees uit cookies
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { error: insertErr } = await supabase.from("offers").insert({
      listing_id: listingId,
      bidder_id: user.id,
      amount: Number(amount),
      status: "pending",
    });

    if (insertErr) {
      console.error(insertErr);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
