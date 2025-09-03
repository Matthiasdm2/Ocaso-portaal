import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

async function getData(): Promise<{
  sponsored: Listing[];
  recommended: Listing[];
}> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/home`,
    { cache: "no-store" },
  );
  return res.json();
}

export default async function ExplorePage() {
  const { sponsored, recommended } = await getData();
  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-xl font-semibold">Ontdekken</h1>

      <section className="space-y-3">
        <h2 className="font-semibold">Populair</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sponsored.map((x) => (
            <ListingCard key={x.id} item={x} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Trending</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {recommended.slice(0, 12).map((x) => (
            <ListingCard key={x.id} item={x} />
          ))}
        </div>
      </section>
    </div>
  );
}
