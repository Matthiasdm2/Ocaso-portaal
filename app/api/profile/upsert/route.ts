// app/api/profile/upsert/route.ts
import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabaseServer";

export async function PUT(req: Request) {
  const payload = await req.json();
  const supabase = supabaseServer();

  const { error } = await supabase.from("profiles").upsert(payload);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
