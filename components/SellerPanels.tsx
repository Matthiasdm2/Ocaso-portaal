"use client";

import Image from "next/image";
import Link from "next/link";

type Seller = {
  id?: string | number | null;
  name?: string | null;
  avatarUrl?: string | null;
  rating?: number | null;
  salesCount?: number | null;
  isBusiness?: boolean | null;
  joinedISO?: string | null;
  responseMins?: number | null;
  lastSeenISO?: string | null;
  cancel_rate_pct?: number | null;
  response_rate_pct?: number | null;
  seller_id?: string | number | null;
  seller_name?: string | null;
  seller_avatar_url?: string | null;
  seller_rating?: number | null;
  seller_sales_count?: number | null;
  seller_is_business?: boolean | null;
};

interface Props {
  seller?: Seller;
  location?: string | null;
  coords?: { lat: number; lng: number } | null;
  shippingAvgDays?: number | null;
  cancelRatePct?: number | null;
  responseRatePct?: number | null;
}

function formatJoined(iso?: string | null) {
  if (!iso) return "Onbekend";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("nl-BE", { year: "numeric", month: "short" });
  } catch {
    return "Onbekend";
  }
}

function stars(r?: number | null) {
  const rnum = Number(r ?? 0);
  const full = Math.floor(rnum);
  const half = rnum - full >= 0.5;
  const parts = Array.from({ length: full }).map((_, i) => (
    <svg key={"f" + i} className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.999 2.336c-.784.57-1.84-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.001 9.397c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
    </svg>
  ));
  if (half) {
    parts.push(
      <svg key="half" className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        <path d="M12 6v12.56L5.82 22 7 14.14 2 9.27l6.91-1.01L12 6z" className="text-gray-200" />
      </svg>,
    );
  }
  return <div className="flex items-center space-x-1">{parts.length ? parts : <span className="text-sm text-gray-500">Nog geen beoordeling</span>}</div>;
}

export default function SellerPanels({
  seller = {},
  location = null,
  coords = null,
  shippingAvgDays = null,
  cancelRatePct = null,
  responseRatePct = null,
}: Props) {
  const id = seller.id ?? seller.seller_id ?? null;
  const name = seller.name ?? seller.seller_name ?? "Onbekend";
  // Fallback naar /placeholder.png als /images/avatar-placeholder.png niet bestaat
  let avatar = seller.avatarUrl ?? seller.seller_avatar_url ?? "/images/avatar-placeholder.png";
  if (avatar === "/images/avatar-placeholder.png") {
    avatar = "/placeholder.png";
  }
  const rating = seller.rating ?? seller.seller_rating ?? null;
  const sales = seller.salesCount ?? seller.seller_sales_count ?? null;
  const isBusiness = !!(seller.isBusiness ?? seller.seller_is_business);

  const mapsLink =
    coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)
      ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
      : location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : null;

  return (
    <aside className="lg:col-span-5 space-y-6">
      <section className="rounded-2xl border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100">
            <Image
              src={avatar}
              alt={name ?? "Avatar"}
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{name}</h3>
              {isBusiness && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Bedrijf
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{formatJoined(seller.joinedISO)}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-gray-500">Beoordeling</div>
            <div className="mt-1 flex items-center justify-center">
              {rating ? (
                <>
                  {stars(rating)}
                  <span className="ml-2 text-sm font-medium text-gray-700">{Number(rating).toFixed(1)}</span>
                </>
              ) : (
                <span className="text-sm text-gray-500">—</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Verkoop</div>
            <div className="mt-1 text-sm font-medium text-gray-700">{sales ? Intl.NumberFormat("nl-BE").format(sales) : "—"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Respons</div>
            <div className="mt-1 text-sm font-medium text-gray-700">
              {seller.responseMins != null ? `${seller.responseMins} min` : responseRatePct != null ? `${Math.round(responseRatePct)}%` : "—"}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t" />

        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Link
            href={id ? `/seller/${id}` : "#"}
            className="flex-1 rounded-full bg-primary text-black px-3 py-1.5 text-sm font-semibold text-center border border-primary/30 hover:bg-primary/80 transition"
          >
            Bekijk profiel
          </Link>
          <button
            type="button"
            onClick={() => {
              window.alert("Bericht sturen (mock)");
            }}
            className="flex-1 rounded-full bg-gray-100 text-gray-700 px-3 py-1.5 text-sm font-semibold text-center border border-gray-300 hover:bg-gray-200 transition"
          >
            Stuur bericht
          </button>
        </div>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Locatie</span>
            <span className="font-medium">{location ?? (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Onbekend")}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Verzending</span>
            <span className="font-medium">{shippingAvgDays ? `${shippingAvgDays} dagen` : "Afhalen/Onbekend"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Annuleringspercentage</span>
            <span className="font-medium">{cancelRatePct != null ? `${Math.round(cancelRatePct)}%` : "—"}</span>
          </div>
        </div>

        {coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng) ? (
          <div className="mt-3 rounded-lg overflow-hidden border">
            <iframe
              title="Locatie kaart"
              src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
              width="100%"
              height="180"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block rounded-lg overflow-hidden border"
              aria-label="Open locatie in maps"
            >
              <div className="h-40 w-full flex items-center justify-center bg-gray-50 text-sm text-gray-500">
                Open locatie in kaart
              </div>
            </a>
          )
        )}
      </section>
        </aside>
      );
    }