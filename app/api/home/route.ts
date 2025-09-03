import { NextResponse } from "next/server";

import type { Listing } from "@/lib/types";

const base: Listing = {
  id: "1",
  title: "iPhone 13",
  description: "64GB, zeer goede staat",
  price: 700,
  currency: "EUR",
  state: "good",
  location: "Gent",
  images: ["/placeholder.png"],
  category: "Elektronica",
  allowOffers: true,
  allowShipping: true,
  sellerId: "seller1",
  createdAt: new Date().toISOString(),
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = Number(searchParams.get("cursor") || "0");
  const sponsored =
    cursor === 0
      ? Array.from({ length: 6 }).map((_, i) => ({
          ...base,
          id: String(i + 1),
          sponsored: true,
          title: `Gesponsord item ${i + 1}`,
          price: 100 + i * 10,
        }))
      : [];
  const recommended = Array.from({ length: 12 }).map((_, i) => ({
    ...base,
    id: "r" + (cursor * 12 + i + 1),
    title: `Aanrader ${cursor * 12 + i + 1}`,
    price: 50 + i * 25,
    sponsored: false,
  }));
  return NextResponse.json({ sponsored, recommended });
}
