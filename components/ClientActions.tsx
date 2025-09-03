"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  listingId?: string | number | null;
  price?: number;
  sellerId?: string | number | null;
  allowOffers?: boolean;
}

export default function ClientActions({
  listingId,
  price,
  sellerId,
  allowOffers,
}: Props) {
  // Zorg dat allowOffers altijd als boolean werkt
  const offersAllowed = !!allowOffers && (allowOffers === true || String(allowOffers).toLowerCase() === "true" || String(allowOffers) === "1" || String(allowOffers).toLowerCase() === "yes");
  const [showBid, setShowBid] = useState(false);
  const [bidValue, setBidValue] = useState("");
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href={listingId ? `/checkout?listing=${listingId}` : "#"}
          className="flex-1 rounded-full bg-primary text-black px-3 py-1.5 text-sm font-semibold text-center border border-primary/30 hover:bg-primary/80 transition"
          aria-label="Koop nu"
        >
          Koop nu — {typeof price === "number" ? new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(price) : "—"}
        </Link>

        <button
          type="button"
          onClick={() => setShowBid(true)}
          className="flex-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-sm font-semibold text-center border border-emerald-200 hover:bg-emerald-100 transition"
        >
          Doe bod
        </button>

        <button
          type="button"
          onClick={() => window.alert(`Contacteer verkoper ${sellerId ?? " (mock) "}`)}
          className="flex-1 rounded-full bg-gray-100 text-gray-700 px-3 py-1.5 text-sm font-semibold text-center border border-gray-300 hover:bg-gray-200 transition"
        >
          Contact
        </button>
      </div>
      {/* Popup bod venster */}
      {showBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-primary flex flex-col gap-4">
            <h3 className="text-lg font-bold text-primary text-center mb-2">Doe een bod</h3>
            {offersAllowed ? (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="bod" className="text-sm font-medium text-gray-700">Bedrag (€)</label>
                  <input
                    id="bod"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bidValue}
                    onChange={e => setBidValue(e.target.value)}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Voer uw bod in"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-primary text-black px-3 py-1.5 text-sm font-semibold border border-primary/30 hover:bg-primary/80 transition"
                    onClick={() => {
                      window.alert(`Bod geplaatst: €${bidValue}`);
                      setShowBid(false);
                      setBidValue("");
                    }}
                  >
                    Plaats bod
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-gray-100 text-gray-700 px-3 py-1.5 text-sm font-semibold border border-gray-300 hover:bg-gray-200 transition"
                    onClick={() => setShowBid(false)}
                  >
                    Annuleer
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-700 text-base py-8">
                Biedingen zijn niet toegestaan voor dit zoekertje.
                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-gray-100 text-gray-700 px-3 py-1.5 text-sm font-semibold border border-gray-300 hover:bg-gray-200 transition"
                    onClick={() => setShowBid(false)}
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}