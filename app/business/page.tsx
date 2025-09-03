"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* =================== Types =================== */
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

type PopularProduct = {
  id: string;
  title: string;
  thumb?: string | null;
  sellers: number;
};

/* =================== Utils =================== */
const cls = (...a: (string | false | undefined)[]) =>
  a.filter(Boolean).join(" ");

/* =================== Page =================== */
export default function BusinessListPage() {
  // Zoekcategorie in de horizontale balk
  const [searchCategory, setSearchCategory] = useState<"business" | "product">(
    "business",
  );
  // Query + filters
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState(0);

  // Data
  const [data, setData] = useState<{
    businesses: Biz[];
    cats: string[];
    cities: string[];
  }>({
    businesses: [],
    cats: [],
    cities: [],
  });
  const [loading, setLoading] = useState(true);

  // Populaire producten
  const [popular, setPopular] = useState<PopularProduct[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);

  // Foto-zoek
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFilters = useMemo(
    () => Boolean(cat || city || minRating > 0),
    [cat, city, minRating],
  );

  /* ---------- Fetch ---------- */
  const fetchData = useCallback(async () => {
    setLoading(true);

    const p = new URLSearchParams();
    p.set("mode", searchCategory); // 'business' | 'product'
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    if (city) p.set("city", city);
    if (minRating > 0) p.set("minRating", String(minRating));

    const res = await fetch("/api/businesses?" + p.toString(), {
      cache: "no-store",
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [searchCategory, q, cat, city, minRating]);

  useEffect(() => {
    // initial fetch
    fetchData();
    // populaire producten
    (async () => {
      try {
        setPopularLoading(true);
        const r = await fetch("/api/popular-products", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setPopular(Array.isArray(j?.items) ? j.items : []);
        } else setPopular([]);
      } catch {
        setPopular([]);
      } finally {
        setPopularLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce op zoek & filters
  useEffect(() => {
    const id = setTimeout(fetchData, 300);
    return () => clearTimeout(id);
  }, [fetchData]);

  /* ---------- Handlers ---------- */
  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  async function handleImageSearch(file: File) {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/search/image", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (json.query) setQ(json.query);
      setSearchCategory("product"); // Foto → product-zoek
      setData({
        businesses: json.businesses || [],
        cats: json.cats || data.cats,
        cities: json.cities || data.cities,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const clearFilters = () => {
    setCat("");
    setCity("");
    setMinRating(0);
  };

  /* ---------- Render ---------- */
  return (
    <div className="container py-8 space-y-6">
      {/* HERO + HORIZONTALE ZOEKBALK */}
      <section className="card p-6 sm:p-7 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Zakelijke handelaars
            </h1>
            <p className="text-sm text-gray-600">
              Zoek op handelaar of product. Tip: je kan ook zoeken met een foto
              (AI).
            </p>
          </div>
          <div className="hidden lg:flex text-xs text-gray-500">
            Modus:&nbsp;
            <span className="font-medium">
              {searchCategory === "business" ? "Handelaars" : "Producten"}
            </span>
          </div>
        </div>

        {/* HORIZONTALE ZOEKBALK (zelfde patroon als voorpagina) */}
        <form onSubmit={onSubmitSearch} className="w-full">
          <div className="flex flex-col md:flex-row gap-2">
            {/* Keuze: Handelaar / Product */}
            <div className="flex rounded-xl border border-gray-200 bg-white p-1 w-full md:w-auto">
              <TabChip
                active={searchCategory === "business"}
                onClick={() => setSearchCategory("business")}
              >
                Handelaars
              </TabChip>
              <TabChip
                active={searchCategory === "product"}
                onClick={() => setSearchCategory("product")}
              >
                Producten
              </TabChip>
            </div>

            {/* Zoekveld */}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                searchCategory === "business"
                  ? "Zoek op handelaar…"
                  : "Zoek op product…"
              }
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />

            {/* Zoeken-knop */}
            <button
              type="submit"
              className="rounded-xl bg-primary text-black px-5 py-3 font-medium"
            >
              Zoeken
            </button>

            {/* Foto (AI) knop */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
              title="Zoek op foto (AI)"
            >
              <CameraIcon />
              Foto (AI)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageSearch(f);
              }}
            />
          </div>
        </form>

        {/* POPULAIRE PRODUCTEN — HORIZONTALE SLIDER */}
        <PopularStrip items={popular} loading={popularLoading} />
      </section>

      {/* FILTERBAR */}
      <section className="card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <FilterSelect
            label="Categorie"
            value={cat}
            onChange={setCat}
            options={data.cats}
            placeholder="Alle categorieën"
          />
          <FilterSelect
            label="Locatie"
            value={city}
            onChange={setCity}
            options={data.cities}
            placeholder="Alle locaties"
          />
          <FilterSelect
            label="Min. beoordeling"
            value={minRating > 0 ? String(minRating) : ""}
            onChange={(v) => setMinRating(v ? Number(v) : 0)}
            options={["3", "4", "4.5"]}
            placeholder="Geen minimum"
            mapLabels={{ "3": "3.0+", "4": "4.0+", "4.5": "4.5+" }}
          />
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className={cls(
                "w-full rounded-xl px-3 py-2 text-sm border transition",
                hasFilters
                  ? "border-primary text-primary bg-primary/10"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50",
              )}
            >
              Wis filters
            </button>
          </div>
        </div>

        {/* Actieve chips */}
        {hasFilters && (
          <div className="pt-3 flex flex-wrap gap-2">
            {cat && <Chip label={cat} onClear={() => setCat("")} />}
            {city && <Chip label={city} onClear={() => setCity("")} />}
            {minRating > 0 && (
              <Chip
                label={`${minRating.toFixed(1)}+`}
                onClear={() => setMinRating(0)}
              />
            )}
          </div>
        )}
      </section>

      {/* RESULTATEN */}
      <section className="space-y-3">
        <div className="text-sm text-gray-600">
          {loading ? "Laden…" : `${data.businesses.length} resultaten`}
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : data.businesses.length === 0 ? (
          <EmptyState mode={searchCategory} q={q} />
        ) : (
          <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.businesses.map((b) => (
              <li key={b.id}>
                <BizCard biz={b} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* =================== UI bouwstenen =================== */

function TabChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "px-3 py-2 text-sm rounded-lg transition",
        active ? "bg-primary text-black" : "bg-transparent hover:bg-gray-100",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  mapLabels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  mapLabels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {mapLabels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-800 px-2.5 py-1 text-xs">
      {label}
      <button
        onClick={onClear}
        className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
        aria-label="Verwijderen"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  );
}

function PopularStrip({
  items,
  loading,
}: {
  items: PopularProduct[];
  loading: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Populaire producten</h2>
        <Link href="/explore" className="text-xs text-primary hover:underline">
          Alles bekijken
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[180px] snap-start card p-3 animate-pulse"
            >
              <div className="w-full h-24 bg-gray-200 rounded-lg" />
              <div className="h-3 w-4/5 bg-gray-200 rounded mt-2" />
              <div className="h-3 w-1/3 bg-gray-100 rounded mt-1" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-xs text-gray-600">
          Nog geen populaire producten.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/explore?query=${encodeURIComponent(p.title)}`}
              className="min-w-[200px] sm:min-w-[220px] snap-start card p-3 hover:shadow-md transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumb || "/placeholder.png"}
                alt=""
                className="w-full h-28 rounded-lg object-cover border bg-white"
              />
              <div className="mt-2 text-sm font-medium truncate">{p.title}</div>
              <div className="text-xs text-gray-600">
                {p.sellers} handelaar{p.sellers === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="card p-5 space-y-3 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
          <div className="h-3 w-56 bg-gray-100 rounded" />
          <div className="h-6 w-36 bg-gray-100 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded ml-auto" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ mode, q }: { mode: "business" | "product"; q: string }) {
  return (
    <div className="card p-10 text-center text-sm text-gray-600">
      <div className="text-base font-medium text-gray-800 mb-1">
        Geen resultaten
      </div>
      <p className="mb-4">
        {q ? (
          mode === "product" ? (
            <>
              Geen handelaars gevonden die{" "}
              <span className="font-medium">“{q}”</span> aanbieden.
            </>
          ) : (
            <>
              Geen handelaars gevonden met{" "}
              <span className="font-medium">“{q}”</span> in naam.
            </>
          )
        ) : (
          "Pas je filters aan of probeer een andere zoekterm."
        )}
      </p>
      <div className="inline-flex gap-2">
        <Link href="/explore" className="rounded-xl border px-3 py-2 text-sm">
          Verken aanbod
        </Link>
        <Link
          href="/business"
          className="rounded-xl bg-primary text-black px-3 py-2 text-sm"
        >
          Bekijk alle handelaars
        </Link>
      </div>
    </div>
  );
}

function BizCard({ biz }: { biz: Biz }) {
  return (
    <article className="card p-5 h-full flex flex-col gap-4 transition hover:shadow-md border border-gray-100">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={biz.logoUrl || "/placeholder.png"}
          alt=""
          className="w-12 h-12 rounded-lg object-cover border bg-white"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{biz.name}</h3>
              <p className="text-xs text-gray-600 truncate">
                {biz.city} • {biz.categories.join(", ")}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-center gap-1 justify-end text-[13px]">
                <Stars rating={biz.rating} />
                <span className="font-medium">{biz.rating.toFixed(1)}</span>
                <span className="text-gray-500">({biz.reviews})</span>
              </div>
              <span
                className={cls(
                  "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  biz.subscriptionActive
                    ? "bg-primary/15 text-primary"
                    : "bg-yellow-100 text-yellow-700",
                )}
              >
                {biz.subscriptionActive ? "Zakelijk actief" : "Gratis profiel"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-end">
        <Link
          href={`/business/${biz.id}`}
          className="rounded-xl bg-primary text-black px-3 py-2 text-sm font-medium"
        >
          Bekijk
        </Link>
      </div>
    </article>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <span className="inline-flex items-center">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={"f" + i} type="full" />
      ))}
      {hasHalf && <Star type="half" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={"e" + i} type="empty" />
      ))}
    </span>
  );
}

function Star({ type }: { type: "full" | "half" | "empty" }) {
  if (type === "full") {
    return (
      <svg
        className="w-4 h-4"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M9.05 2.927a1 1 0 011.9 0l1.13 3.484a1 1 0 00.95.69h3.66c.97 0 1.37 1.24.59 1.81l-2.96 2.15a1 1 0 00-.36 1.12l1.13 3.48c.3.93-.76 1.69-1.55 1.12l-2.96-2.15a1 1 0 00-1.18 0l-2.96 2.15c-.79.57-1.85-.19-1.55-1.12l1.13-3.48a1 1 0 00-.36-1.12L2.72 8.91c-.78-.57-.38-1.81.59-1.81h3.66a1 1 0 00.95-.69l1.13-3.484z" />
      </svg>
    );
  }
  if (type === "half") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 20 20" aria-hidden="true">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          fill="url(#half)"
          d="M9.05 2.927a1 1 0 011.9 0l1.13 3.484a1 1 0 00.95.69h3.66c.97 0 1.37 1.24.59 1.81l-2.96 2.15a1 1 0 00-.36 1.12l1.13 3.48c.3.93-.76 1.69-1.55 1.12l-2.96-2.15a1 1 0 00-1.18 0l-2.96 2.15c-.79.57-1.85-.19-1.55-1.12l1.13-3.48a1 1 0 00-.36-1.12L2.72 8.91c-.78-.57-.38-1.81.59-1.81h3.66a1 1 0 00.95-.69l1.13-3.484z"
        />
        <path
          stroke="currentColor"
          strokeWidth="0.8"
          fill="none"
          d="M9.05 2.927a1 1 0 011.9 0l1.13 3.484a1 1 0 00.95.69h3.66c.97 0 1.37 1.24.59 1.81l-2.96 2.15a1 1 0 00-.36 1.12l1.13 3.48c.3.93-.76 1.69-1.55 1.12l-2.96-2.15a1 1 0 00-1.18 0l-2.96 2.15c-.79.57-1.85-.19-1.55-1.12l1.13-3.48a1 1 0 00-.36-1.12L2.72 8.91c-.78-.57-.38-1.81.59-1.81h3.66a1 1 0 00.95-.69l1.13-3.484z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-4 h-4 text-gray-300"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.05 2.927a1 1 0 011.9 0l1.13 3.484a1 1 0 00.95.69h3.66c.97 0 1.37 1.24.59 1.81l-2.96 2.15a1 1 0 00-.36 1.12l1.13 3.48c.3.93-.76 1.69-1.55 1.12l-2.96-2.15a1 1 0 00-1.18 0l-2.96 2.15c-.79.57-1.85-.19-1.55-1.12l1.13-3.48a1 1 0 00-.36-1.12L2.72 8.91c-.78-.57-.38-1.81.59-1.81h3.66a1 1 0 00.95-.69l1.13-3.484z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      fill="none"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7h2l2-3h10l2 3h2v14H3V7z"
      />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
