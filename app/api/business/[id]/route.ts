import { NextResponse } from "next/server";

/**
 * Optional: if you have Supabase set up, uncomment these two lines
 * and make sure '@/lib/supabaseClient' exports a server client.
 */
// import { createClient } from '@/lib/supabaseServer'; // your server-side supabase factory
// const supabase = createClient();

type Biz = {
  id: string;
  name: string;
  categories: string[];
  city: string;
  rating: number;
  reviews: number;
  subscriptionActive: boolean;
  logoUrl?: string | null;
};

// ---- Mock dataset as a guaranteed fallback (no more 500s) ----
const MOCK_BIZ: Biz[] = [
  {
    id: "b1",
    name: "Vintage Corner",
    categories: ["Meubels", "Decor"],
    city: "Gent",
    rating: 4.6,
    reviews: 128,
    subscriptionActive: true,
    logoUrl: null,
  },
  {
    id: "b2",
    name: "Ocaso Bikes",
    categories: ["Fietsen", "Onderhoud"],
    city: "Antwerpen",
    rating: 4.2,
    reviews: 89,
    subscriptionActive: true,
    logoUrl: null,
  },
  {
    id: "b3",
    name: "Retro Audio",
    categories: ["Audio", "Elektronica"],
    city: "Brugge",
    rating: 4.8,
    reviews: 203,
    subscriptionActive: false,
    logoUrl: null,
  },
  {
    id: "b4",
    name: "Sneaker Hub",
    categories: ["Fashion"],
    city: "Leuven",
    rating: 4.4,
    reviews: 57,
    subscriptionActive: true,
    logoUrl: null,
  },
  {
    id: "b5",
    name: "Book & Co",
    categories: ["Boeken"],
    city: "Mechelen",
    rating: 4.1,
    reviews: 33,
    subscriptionActive: false,
    logoUrl: null,
  },
];

// Minimal product map for product-mode fallback
const MOCK_PRODUCTS: Array<{ id: string; title: string; sellerId: string }> = [
  { id: "p1", title: "iPhone 13", sellerId: "b3" },
  { id: "p2", title: "Gazelle e-bike", sellerId: "b2" },
  { id: "p3", title: "Vintage kast", sellerId: "b1" },
  { id: "p4", title: "Nike Dunk Low", sellerId: "b4" },
];

function normalizeString(s: string) {
  return s.toLocaleLowerCase("nl-BE");
}

function filterBusinesses(
  arr: Biz[],
  {
    q,
    cat,
    city,
    minRating,
  }: { q?: string; cat?: string; city?: string; minRating?: number },
) {
  let out = arr.slice();
  if (q) {
    const n = normalizeString(q);
    out = out.filter(
      (b) =>
        normalizeString(b.name).includes(n) ||
        b.categories.some((c) => normalizeString(c).includes(n)) ||
        normalizeString(b.city).includes(n),
    );
  }
  if (cat) out = out.filter((b) => b.categories.includes(cat));
  if (city) out = out.filter((b) => b.city === city);
  if (minRating && minRating > 0)
    out = out.filter((b) => b.rating >= minRating);
  return out;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get("mode") || "business") as
      | "business"
      | "product";
    const q = searchParams.get("q") || "";
    const cat = searchParams.get("cat") || "";
    const city = searchParams.get("city") || "";
    const minRating = Number(searchParams.get("minRating") || 0);

    // ---- If you have Supabase tables, try them first (keep wrapped in try) ----
    // Expected tables (example):
    // - businesses(id, name, city, rating, reviews, subscription_active, logo_url)
    // - business_categories(business_id, category) OR 'categories' array column on businesses
    // - products(id, title, seller_id)
    //
    // const useSupabase = !!supabase; // only true if you wired it
    // if (useSupabase) { ...query and return like below }

    // ---- Fallback to safe mock behaviour ----
    let items: Biz[] = MOCK_BIZ;

    if (mode === "business") {
      items = filterBusinesses(MOCK_BIZ, { q, cat, city, minRating });
    } else {
      // product mode → find sellers that offer products matching q
      const sellerIds = new Set<string>();
      const needle = normalizeString(q || "");
      const matched = MOCK_PRODUCTS.filter((p) =>
        needle ? normalizeString(p.title).includes(needle) : true,
      );
      matched.forEach((p) => sellerIds.add(p.sellerId));
      items = MOCK_BIZ.filter((b) => sellerIds.has(b.id));
      // then still allow cat/city/minRating filters
      items = filterBusinesses(items, { q: "", cat, city, minRating });
    }

    // derive cats & cities from (filtered) universe lists to populate dropdowns
    const cats = Array.from(
      new Set(MOCK_BIZ.flatMap((b) => b.categories)),
    ).sort();
    const cities = Array.from(new Set(MOCK_BIZ.map((b) => b.city))).sort();

    return NextResponse.json({ businesses: items, cats, cities });
  } catch (err) {
    // Never explode: still return mocks so UI stays alive
    return NextResponse.json(
      {
        businesses: MOCK_BIZ,
        cats: Array.from(new Set(MOCK_BIZ.flatMap((b) => b.categories))),
        cities: Array.from(new Set(MOCK_BIZ.map((b) => b.city))),
      },
      { status: 200 },
    );
  }
}
