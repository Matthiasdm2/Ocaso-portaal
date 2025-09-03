"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type Listing = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string | null;
  condition?: "nieuw" | "zo goed als nieuw" | "goed" | "gebruikt";
  isFeatured?: boolean;
  isInStock?: boolean;
  createdAt?: string;
  category?: string;
};

function toPrice(n: number) {
  return n.toLocaleString("nl-BE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function categoriesOf(listings: Listing[]) {
  const set = new Set(
    listings.map((l) => l.category).filter(Boolean) as string[],
  );
  return Array.from(set);
}

function sortsOf() {
  return [
    { id: "recent", label: "Recent" },
    { id: "price-asc", label: "Prijs ↑" },
    { id: "price-desc", label: "Prijs ↓" },
    { id: "featured", label: "Uitgelicht" },
  ] as const;
}

export default function ClientListingsGrid({
  initial,
}: {
  initial: Listing[];
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("alle");
  const [sort, setSort] = useState<string>("recent");
  const [inStock, setInStock] = useState(false);

  const cats = useMemo(() => ["alle", ...categoriesOf(initial)], [initial]);
  const sorts = sortsOf();

  const filtered = useMemo(() => {
    let arr = [...initial];
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((l) => l.title.toLowerCase().includes(q));
    }
    if (cat !== "alle") arr = arr.filter((l) => l.category === cat);
    if (inStock) arr = arr.filter((l) => l.isInStock !== false);

    switch (sort) {
      case "price-asc":
        arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price-desc":
        arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "featured":
        arr.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
        break;
      default:
        arr.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        );
    }
    return arr;
  }, [initial, query, cat, sort, inStock]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek binnen dit aanbod…"
          className="input w-full sm:w-64"
          aria-label="Zoeken"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="select"
        >
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="select"
        >
          {sorts.map((s) => (
            <option key={s.id} value={s.id}>
              Sorteren: {s.label}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="checkbox"
          />
          Op voorraad
        </label>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((x) => (
          <article
            key={x.id}
            className="rounded-xl border overflow-hidden hover:shadow-sm transition"
          >
            <div className="relative aspect-square bg-gray-50">
              {x.imageUrl ? (
                <Image
                  src={x.imageUrl}
                  alt={x.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-gray-400 text-sm">
                  Geen foto
                </div>
              )}
              {x.isFeatured ? (
                <span className="absolute top-2 left-2 px-2 py-0.5 text-xs rounded-full bg-black/70 text-white">
                  Uitgelicht
                </span>
              ) : null}
            </div>
            <div className="p-3">
              <h3 className="font-medium line-clamp-2 min-h-[3rem]">
                {x.title}
              </h3>
              <div className="mt-1 text-sm text-gray-600">
                {x.condition ? (
                  <span className="capitalize">{x.condition}</span>
                ) : (
                  <span>—</span>
                )}
                {x.category ? <span> • {x.category}</span> : null}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-lg font-semibold">
                  € {toPrice(x.price ?? 0)}
                </div>
                <Link href={`/listing/${x.id}`} className="btn btn-sm">
                  Bekijken
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-gray-600">
          Geen resultaten voor je filters.
        </div>
      ) : null}
    </div>
  );
}
