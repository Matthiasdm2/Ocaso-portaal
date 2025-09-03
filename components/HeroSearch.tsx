"use client";
import { Camera, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useToast } from "./Toast";

const MOCK = [
  "iPhone 13",
  "Moderne sofa",
  "DSLR camera",
  "Mountain bike",
  "Elektrische step",
  "AirPods Pro",
];

export default function HeroSearch() {
  const [q, setQ] = useState("");
  const [show, setShow] = useState(false);
  const { push } = useToast();
  const results = useMemo(
    () =>
      MOCK.filter((x) => x.toLowerCase().includes(q.toLowerCase())).slice(0, 5),
    [q],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShow(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section id="hero-observe" className="container py-10">
      <div className="card p-6 md:p-10">
        <h1 className="text-2xl md:text-4xl font-bold mb-6">
          Zoek tweedehands. Slim en snel.
        </h1>
        <div className="relative flex flex-col md:flex-row gap-3">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShow(true);
              }}
              onFocus={() => setShow(true)}
              placeholder="Waar ben je naar op zoek?"
              className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <button
            onClick={() => push("Foto-zoek (AI) demo — nog te koppelen.")}
            className="rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-2 hover:bg-gray-50"
          >
            <Camera className="size-5" /> Zoek op foto (AI)
          </button>

          {show && q && (
            <div className="absolute top-full mt-2 left-0 right-0 md:right-auto md:w-[60%] bg-white rounded-xl border shadow-smooth overflow-hidden z-10">
              {results.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-600">
                  Geen suggesties
                </div>
              )}
              {results.map((r) => (
                <a
                  key={r}
                  href={`/search?q=${encodeURIComponent(r)}`}
                  className="block px-4 py-3 hover:bg-gray-50 text-sm"
                >
                  {r}
                </a>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          De zoekbalk in de header verschijnt zodra je naar beneden scrolt.
        </p>
      </div>
    </section>
  );
}
