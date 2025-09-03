"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Listing } from "@/lib/types";

import FavoriteButton from "./FavoriteButton";
import QuickViewModal from "./QuickViewModal";

export default function ListingCard({ item }: { item: Listing }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group relative card p-3 hover:shadow-md transition">
      <button
        onClick={() => setOpen(true)}
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition bg-white rounded-full px-3 py-1 text-xs shadow"
      >
        Quick view
      </button>
      <div className="absolute left-3 top-3">
        <FavoriteButton id={item.id} />
      </div>
      <Link href={`/listings/${item.id}`}>
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={item.images[0] || "/placeholder.png"}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition"
          />
        </div>
        <div className="mt-3">
          <h3 className="font-medium line-clamp-1">{item.title}</h3>
          <div className="text-sm text-gray-600 line-clamp-2">
            {item.description}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold">€ {item.price.toFixed(0)}</span>
            {item.sponsored && <span className="badge">Gesponsord</span>}
          </div>
        </div>
      </Link>
      <QuickViewModal open={open} onClose={() => setOpen(false)} item={item} />
    </div>
  );
}
