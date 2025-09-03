// app/business/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";

import ClientListingsGrid from "@/components/business/ClientListingsGrid";

type Listing = {
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

type Review = {
  id: string;
  author?: string;
  rating: number; // 1-5
  comment?: string;
  date?: string;
};

type Business = {
  id: string;
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  categories?: string[];
  keywords?: string[];
  verified?: boolean;
  rating?: number; // 0-5
  reviewCount?: number;
  responseTimeHours?: number;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: { street?: string; zip?: string; city?: string; country?: string };
  social?: { instagram?: string; facebook?: string; linkedin?: string };
  stats?: {
    totalListings?: number;
    sold?: number;
    avgPrice?: number;
    views?: number;
    followers?: number;
  };
  trust?: {
    safePayEnabled?: boolean;
    shippingEnabled?: boolean;
    returnPolicyDays?: number;
  };
  listings: Listing[];
  reviews?: Review[];
};

async function getBusiness(id: string): Promise<Business> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/business/${id}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to fetch business");
  return res.json();
}

export default async function BusinessPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getBusiness(params.id);

  const {
    name,
    logoUrl,
    bannerUrl,
    description,
    categories = [],
    verified,
    rating = 0,
    reviewCount = 0,
    responseTimeHours,
    website,
    email,
    phone,
    address,
    social,
    stats,
    trust,
    listings = [],
  } = data;

  const addressLine = [
    address?.street,
    [address?.zip, address?.city].filter(Boolean).join(" "),
    address?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: website || process.env.NEXT_PUBLIC_BASE_URL,
    logo: logoUrl || undefined,
    sameAs: [social?.instagram, social?.facebook, social?.linkedin].filter(
      Boolean,
    ),
    address: addressLine || undefined,
    aggregateRating:
      reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: rating.toFixed(1),
            reviewCount,
          }
        : undefined,
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Banner + header */}
      <div className="card p-0 overflow-hidden">
        <div className="relative h-40 w-full bg-muted">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt={`${name} banner`}
              fill
              className="object-cover"
              priority
            />
          ) : null}
        </div>

        <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl bg-primary overflow-hidden ring-2 ring-white -mt-12 md:mt-0 md:-ml-10">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${name} logo`}
                  fill
                  className="object-cover"
                />
              ) : null}
            </div>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                {name}
                {verified ? <VerifiedBadge /> : null}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <RatingStars rating={rating} />
                <span>({reviewCount})</span>
                {responseTimeHours ? (
                  <span>• Reactietijd ~ {responseTimeHours}u</span>
                ) : null}
                {addressLine ? <span>• {addressLine}</span> : null}
              </div>
              {categories?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 text-xs rounded-full bg-gray-100"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-wrap gap-2">
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                aria-label="Bezoek website"
              >
                Website
              </a>
            ) : null}
            {email ? (
              <a href={`mailto:${email}`} className="btn">
                E-mail
              </a>
            ) : null}
            {phone ? (
              <a href={`tel:${phone}`} className="btn">
                Bel
              </a>
            ) : null}
            <ShareMenu name={name} />
          </div>
        </div>
      </div>

      {/* Trust & stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Vertrouwen & Zekerheid</h2>
          <div className="space-y-3">
            <TrustRow
              enabled={!!trust?.safePayEnabled}
              title="Veilig betalen via OCASO"
              desc="Geld staat in bewaring tot de deal is afgerond."
            />
            <TrustRow
              enabled={!!trust?.shippingEnabled}
              title="Slim verzenden via OCASO"
              desc="Traceerbaar en correct geprijsd, zonder gedoe."
            />
            {typeof trust?.returnPolicyDays === "number" ? (
              <TrustRow
                enabled
                title={`Retourbeleid (${trust.returnPolicyDays} dagen)`}
                desc="Kleine lettertjes groot en duidelijk."
              />
            ) : null}
            <AIConfidence />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-4">Statistieken</h2>
          <div className="grid grid-cols-2 gap-4">
            <Stat
              label="Actieve zoekertjes"
              value={stats?.totalListings ?? listings.length}
            />
            <Stat label="Verkocht" value={stats?.sold ?? 0} />
            <Stat
              label="Gem. prijs"
              value={
                typeof stats?.avgPrice === "number"
                  ? `€ ${toPrice(stats!.avgPrice)}`
                  : "—"
              }
            />
            <Stat label="Bezoeken" value={stats?.views ?? "—"} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-4">Over {name}</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {description || "Beschrijving volgt binnenkort."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {social?.instagram ? (
              <a
                className="link"
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            ) : null}
            {social?.facebook ? (
              <a
                className="link"
                href={social.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            ) : null}
            {social?.linkedin ? (
              <a
                className="link"
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-semibold">Aanbod</h2>
          <small className="text-gray-600">
            {listings.length} zoekertje{listings.length === 1 ? "" : "s"}
          </small>
        </div>
        <div className="mt-4">
          <ClientListingsGrid initial={listings} />
        </div>
      </div>

      {/* Reviews */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Reviews</h2>
          <div className="text-sm text-gray-600">
            <RatingStars rating={rating} /> ({reviewCount})
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {(data.reviews ?? []).slice(0, 6).map((r) => (
            <div key={r.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {r.author || "Anonieme koper"}
                </div>
                <RatingStars rating={r.rating} />
              </div>
              {r.comment ? (
                <p className="mt-2 text-gray-700">{r.comment}</p>
              ) : null}
              {r.date ? (
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(r.date).toLocaleDateString()}
                </div>
              ) : null}
            </div>
          ))}
          {(data.reviews ?? []).length === 0 ? (
            <div className="text-gray-600 text-sm">
              Nog geen reviews. Wees de eerste om een beoordeling achter te
              laten.
            </div>
          ) : null}
        </div>
      </div>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  );
}

/* -------------------------- Helpers (server-safe) -------------------------- */

function toPrice(n: number) {
  return n.toLocaleString("nl-BE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <svg width="14" height="14" viewBox="0 0 24 24" className="-ml-0.5">
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      Geverifieerd
    </span>
  );
}

function RatingStars({ rating = 0 }: { rating?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center">
      {[0, 1, 2, 3, 4].map((i) => {
        if (i < full) return <Star key={i} filled />;
        if (i === full && half) return <Star key={i} half />;
        return <Star key={i} />;
      })}
      <span className="ml-2 text-sm">{rating.toFixed(1)}</span>
    </span>
  );
}

function Star({ filled, half }: { filled?: boolean; half?: boolean }) {
  if (half)
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        className="text-yellow-500"
      >
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          fill="url(#half)"
          stroke="currentColor"
        />
      </svg>
    );
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      className={filled ? "text-yellow-500" : "text-gray-300"}
    >
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill="currentColor"
      />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}

function TrustRow({
  enabled,
  title,
  desc,
}: {
  enabled: boolean;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border ${enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}
        aria-hidden
      >
        {enabled ? "✓" : "—"}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-600">{desc}</div>
      </div>
    </div>
  );
}

function AIConfidence() {
  return (
    <div className="rounded-lg border p-3">
      <div className="font-medium">AI-vertrouwen</div>
      <ul className="mt-1.5 text-sm text-gray-700 list-disc list-inside space-y-1">
        <li>Automatische prijscheck & alternatieven</li>
        <li>Productherkenning voor juiste categorie & titel</li>
        <li>Fraudedetectie op basis van gedragssignalen</li>
        <li>SEO-boost voor zakelijk aanbod</li>
      </ul>
    </div>
  );
}

function ShareMenu({ name }: { name: string }) {
  // simple share links (no window usage here; they work as plain anchors)
  const shareHref = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/business/share?b=${encodeURIComponent(name)}`;
  return (
    <div className="flex gap-2">
      <Link
        className="btn"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareHref)}`}
        target="_blank"
      >
        Delen
      </Link>
      <Link
        className="btn"
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareHref)}&text=${encodeURIComponent(`Ontdek het aanbod van ${name} op OCASO`)}`}
        target="_blank"
      >
        Tweet
      </Link>
      <Link
        className="btn"
        href={`https://www.linkedin.com/shareArticle?url=${encodeURIComponent(shareHref)}&title=${encodeURIComponent(name)}`}
        target="_blank"
      >
        LinkedIn
      </Link>
    </div>
  );
}
