"use client";
import { useEffect, useRef, useState } from "react";

import type { Listing } from "@/lib/types";

import ListingCard from "./ListingCard";

export default function InfiniteGrid() {
  const [items, setItems] = useState<Listing[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      async ([e]) => {
        if (e.isIntersecting && !loading) {
          setLoading(true);
          const res = await fetch(`/api/home?cursor=${cursor}`);
          const data = await res.json();
          setItems((prev) =>
            prev.length >= 20
              ? prev
              : [...prev, ...data.recommended].slice(0, 20),
          );
          setCursor(cursor + 1);
          setLoading(false);
        }
      },
      { rootMargin: "200px" },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [cursor, loading]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((it) => (
          <ListingCard key={`${it.id}-${Math.random()}`} item={it} />
        ))}
      </div>
      <div ref={ref} className="text-center py-6 text-sm text-gray-500">
        {loading ? "Laden…" : "Scroll voor meer"}
      </div>
    </div>
  );
}
