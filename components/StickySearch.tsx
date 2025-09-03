"use client";
import { Search } from "lucide-react";

export default function StickySearch() {
  return (
    <div className="border-t border-gray-100 bg-white">
      <div className="container py-2">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5" />
          <input
            placeholder="Zoek naar producten..."
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>
    </div>
  );
}
