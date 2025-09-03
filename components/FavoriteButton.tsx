"use client";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

export default function FavoriteButton({ id }: { id: string }) {
  const [fav, setFav] = useState(false);
  useEffect(() => {
    const list = JSON.parse(
      localStorage.getItem("favorites") || "[]",
    ) as string[];
    setFav(list.includes(id));
  }, [id]);
  const toggle = () => {
    const list = new Set<string>(
      JSON.parse(localStorage.getItem("favorites") || "[]"),
    );
    if (list.has(id)) {
      list.delete(id);
      setFav(false);
    } else {
      list.add(id);
      setFav(true);
    }
    localStorage.setItem("favorites", JSON.stringify(Array.from(list)));
  };
  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-full ${fav ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-600"}`}
      title="Bewaar als favoriet"
    >
      <Heart className={`size-4 ${fav ? "fill-current" : ""}`} />
    </button>
  );
}
