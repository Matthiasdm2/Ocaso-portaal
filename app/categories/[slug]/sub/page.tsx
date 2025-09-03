// app/categorien/[slug]/[sub]/page.tsx
import Image from "next/image";
import Link from "next/link";

async function getListings(slug: string, sub: string) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/listings?category=${encodeURIComponent(slug)}&subcategory=${encodeURIComponent(sub)}`;
  const res = await fetch(url, {
    next: { tags: [`category:${slug}:${sub}`] }, // <- wordt gerevalideerd
    cache: "force-cache",
  });
  if (!res.ok) return { items: [], total: 0 };
  return res.json();
}

export default async function SubCategoryPage({ params }: { params: { slug: string; sub: string } }) {
  const { slug, sub } = params;
  const { items, total } = await getListings(slug, sub);

  type Listing = {
    id: string | number;
    title: string;
    price: number;
    main_photo?: string;
  };

  return (
    <div className="container py-6">
      <h1 className="text-xl font-semibold mb-1">Categorie: {slug}</h1>
      <h2 className="text-base text-gray-600 mb-4">Subcategorie: {sub}</h2>
      <p className="text-sm text-gray-500 mb-6">{total} zoekertjes gevonden</p>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
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
