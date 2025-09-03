"use client";
import { Eye } from "lucide-react";

import FavoriteButton from "./FavoriteButton";

export default function ListingStats({ id, views = 0, favorites = 0 }: { id: string; views?: number; favorites?: number }) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
      <div className="flex items-center gap-1">
        <Eye className="size-4" />
        <span>{views}</span>
      </div>
      <div className="flex items-center gap-1">
        <FavoriteButton id={id} />
        <span>{favorites}</span>
      </div>
    </div>
  );
}
