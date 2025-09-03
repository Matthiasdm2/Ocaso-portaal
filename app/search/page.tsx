import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

async function searchListings(
  query: string,
  cat: string,
  sub: string,
): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (cat) params.set("cat", cat);
  if (sub) params.set("sub", sub);
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/search?` + params.toString(),
    { cache: "no-store" },
  );
  const data = await res.json();
  return data.results;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; cat?: string; sub?: string };
}) {
  const q = searchParams.q || "";
  const cat = searchParams.cat || "";
  const sub = searchParams.sub || "";
  const results = await searchListings(q, cat, sub);

  const label = q || sub || cat || "Alles";

  return (
    <div className="container py-8 space-y-4">
      <h1 className="text-xl font-semibold">Zoekresultaten</h1>
      <div className="text-sm text-gray-600">
        Zoeken in: <strong>{label}</strong> • {results.length} resultaten
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {results.map((x) => (
          <ListingCard key={x.id} item={x} />
        ))}
      </div>
    </div>
  );
}
