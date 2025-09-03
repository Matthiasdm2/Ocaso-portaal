// app/categorien/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";

type Listing = {
  id: string | number;
  title: string;
  price: number;
  main_photo?: string;
};

async function getListings(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/listings?category=${encodeURIComponent(slug)}`, {
    next: { tags: [`category:${slug}`] }, // <- wordt gerevalideerd
    cache: "force-cache",
  });
  if (!res.ok) return { items: [], total: 0 };
  return res.json();
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { items } = await getListings(slug);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((it: Listing) => (
          <Link key={it.id} href={`/listings/${it.id}`} className="block rounded-xl border p-3 hover:shadow">
            <div className="aspect-square w-full rounded-lg bg-gray-100 overflow-hidden mb-2">
              {it.main_photo ? (
                <Image
                  src={it.main_photo}
                  alt={it.title}
                  fill
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
              ) : null}
            </div>
            <div className="font-medium line-clamp-1">{it.title}</div>
            <div className="text-sm text-gray-700">€ {it.price}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
