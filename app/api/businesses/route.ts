// app/api/businesses/route.ts
import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabaseServer";

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
function like({ q }: { q: string; }) {
  return `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
}
// Probeer waarde uit meerdere mogelijke kolommen te halen
type Profile = {
  id: string;
  company_name?: string;
  shop_name?: string;
  full_name?: string;
  categories?: string[];
  city?: string;
  address?: { city?: string };
  invoice_address?: { city?: string };
  rating?: number;
  avg_rating?: number;
  reviews?: number;
  review_count?: number;
  business_plan?: string;
  subscription_active?: boolean;
  is_business?: boolean;
};

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

function mapProfileToBiz(p: Profile) {
  const name =
    pick<string>(p, "company_name", "shop_name", "full_name") || "Onbekend";
  const categories = Array.isArray(p.categories) ? p.categories : [];
  const city =
    pick<string>(p, "city") ||
    pick<string>(p.address ?? {}, "city") ||
    pick<string>(p.invoice_address ?? {}, "city") ||
    "";
  const rating = Number(p.rating ?? p.avg_rating ?? 0);
  const reviews = Number(p.reviews ?? p.review_count ?? 0);
  const plan = String(p.business_plan || "").toLowerCase();
  const subscriptionActive =
    plan === "pro" || plan === "premium" || !!p.subscription_active;

  return {
    id: p.id,
    name,
    categories,
    city,
    rating,
    reviews,
    subscriptionActive,
  };
}

export async function GET(req: Request) {
  try {
    // Parse query params
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const mode = searchParams.get("mode") ?? "business";
    const cat = searchParams.get("cat") ?? "";
    const city = searchParams.get("city") ?? "";
    const minRating = Number(searchParams.get("minRating") ?? 0);

    // Use supabaseServer (imported above)
    const supabase = supabaseServer();

    // Fetch all businesses
    const { data: allBiz, error: allBizErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_business", true);

    if (allBizErr) {
      console.error("[/api/businesses] allBiz error:", allBizErr);
      return NextResponse.json(
        { error: allBizErr.message, businesses: [], cats: [], cities: [] },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    const safeAll: Profile[] = (allBiz ?? []) as Profile[];

    const allCats = uniq(
      safeAll.flatMap((p: Profile) =>
        Array.isArray(p.categories) ? p.categories : [],
      ),
    ).sort((a: string, b: string) => String(a).localeCompare(String(b)));

    const allCities = uniq(
      safeAll
        .map(
          (p: Profile) =>
            p.city || p.address?.city || p.invoice_address?.city || null,
        )
        .filter(Boolean) as string[],
    ).sort((a: string, b: string) => a.localeCompare(b));

    // 2) Zoekresultaten
    let resultProfiles: Profile[] = [];

    if (mode === "product") {
      // a) optioneel: match sellers via listings.title
      let sellerIds: string[] = [];
      if (q) {
        const { data: listHits, error: listErr } = await supabase
          .from("listings")
          .select("seller_id")
          .ilike("title", like({ q }));
          // .neq("status","draft")  // ❌ laat weg als kolom mogelijk niet bestaat

        if (listErr) {
          console.error("[/api/businesses] listings error:", listErr);
        } else {
          sellerIds = uniq((listHits || []).map((r: { seller_id: string }) => r.seller_id).filter(Boolean));
        }
      }

      let prof = supabase.from("profiles").select("*").eq("is_business", true);
      if (q) {
        if (sellerIds.length === 0) {
          resultProfiles = [];
        } else {
          prof = prof.in("id", sellerIds);
          const { data, error } = await prof;
          if (error) {
            console.error("[/api/businesses] product profiles error:", error);
            resultProfiles = [];
          } else {
            resultProfiles = data || [];
          }
        }
      } else {
        const { data, error } = await prof;
        if (error) {
          console.error("[/api/businesses] product all profiles error:", error);
          resultProfiles = [];
        } else {
          resultProfiles = data || [];
        }
      }
    } else {
      // MODE BUSINESS — OR-zoekopdracht op company_name | shop_name
      let prof = supabase.from("profiles").select("*").eq("is_business", true);

      if (q) {
        prof = prof.or(`company_name.ilike.${like({ q })},shop_name.ilike.${like({ q })}`);
      }

      const { data, error } = await prof;
      if (error) {
        console.error("[/api/businesses] business profiles error:", error);
        resultProfiles = [];
      } else {
        resultProfiles = data || [];
      }
    }

    // 3) Filters toepassen (best-effort)
    if (cat) {
      resultProfiles = resultProfiles.filter((p) =>
        Array.isArray(p.categories) ? p.categories.includes(cat) : false,
      );
    }
    if (city) {
      resultProfiles = resultProfiles.filter((p) => {
        const c =
          p.city ||
          p.address?.city ||
          p.invoice_address?.city ||
          "";
        return c === city;
      });
    }
    if (minRating > 0) {
      resultProfiles = resultProfiles.filter(
        (p) => Number(p.rating ?? p.avg_rating ?? 0) >= minRating,
      );
    }

    // 4) Map naar compact frontend type
    const businesses = resultProfiles.map(mapProfileToBiz);

    return NextResponse.json(
      { businesses, cats: allCats, cities: allCities },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: unknown) {
    console.error("[/api/businesses] unexpected:", err);
    let errorMessage = "Server error";
    if (typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: string }).message === "string") {
      errorMessage = (err as { message: string }).message;
    }
    return NextResponse.json(
      { error: errorMessage, businesses: [], cats: [], cities: [] },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
