import { NextResponse } from "next/server";

import type { Listing } from "@/lib/types";

const BASE: Listing = {
  id: "x",
  title: "Uitgelicht item",
  description: "Opvallend aanbod binnen deze categorie",
  price: 199,
  currency: "EUR",
  state: "good",
  location: "Gent",
  images: ["/placeholder.png"],
  category: "Algemeen",
  allowOffers: true,
  allowShipping: true,
  sellerId: "s1",
  createdAt: new Date().toISOString(),
  sponsored: true,
};

function make(id: number, title: string, cat: string, sub?: string): Listing {
  return {
    ...BASE,
    id: String(id),
    title,
    category: sub ? `${cat} > ${sub}` : cat,
    price: 50 + ((id * 13) % 400),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cat = searchParams.get("cat") || "Algemeen";
  const sub = searchParams.get("sub") || "";

  const titles = [
    "Topdeal",
    "Premium keuze",
    "Aanrader",
    "Hot item",
    "Kansje",
    "Nieuw binnen",
    "Netjes",
    "Bijna nieuw",
    "Scherpe prijs",
    "Populair",
  ];
  const items = Array.from({ length: 12 }).map((_, i) =>
    make(
      i + 1,
      `${titles[i % titles.length]} #${i + 1}`,
      cat,
      sub || undefined,
    ),
  );

  return NextResponse.json({ items });
}
