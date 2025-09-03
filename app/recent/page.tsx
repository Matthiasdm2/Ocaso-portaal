import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

async function getData(): Promise<{ recommended: Listing[] }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/home`,
    { cache: "no-store" },
  );
  const data = await res.json();
  return { recommended: data.recommended };
}

export default async function RecentPage() {
  const { recommended } = await getData();
  return (
    <div className="container py-8 space-y-4">
      <h1 className="text-xl font-semibold">Recent toegevoegd</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {recommended.slice(0, 20).map((x) => (
          <ListingCard key={x.id} item={x} />
        ))}
      </div>
    </div>
  );
}
