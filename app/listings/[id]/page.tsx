// app/listings/[id]/page.tsx


import BackBar from "@/components/BackBar";
import ClientActions from "@/components/ClientActions";
import ImageGallery from "@/components/ImageGallery";
import ListingStats from "@/components/ListingStats";
import SellerPanels from "@/components/SellerPanels";
import { supabaseServer } from "@/lib/supabaseServer";
import type { Category, Subcategory } from "@/lib/types";


export default async function ListingPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  // Haal het zoekertje op inclusief categorieën
  const { data: listing, error } = await supabase
    .from("listings")
    .select("*,categories")
    .eq("id", params.id)
    .maybeSingle();
  // Haal hoogste bod en aantal biedingen direct uit Supabase
  const { data: bids } = await supabase
    .from("bids")
    .select("amount")
    .eq("listing_id", params.id);
  const highestBid = bids && bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : null;
  const bidCount = bids ? bids.length : 0;

  if (error || !listing) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Zoekertje niet gevonden.</p>
      </div>
    );
  }

  // Haal categorieën en subcategorieën op
  let category: Category | null = null;
  let subcategory: Subcategory | null = null;
  if (Array.isArray(listing.categories) && listing.categories.length > 0) {
    const catId = listing.categories[0];
    const subcatId = listing.categories[1];
    const { data: cat } = await supabase.from("categories").select("*").eq("id", catId).maybeSingle();
    category = cat ?? null;
    if (subcatId) {
      const { data: subcat } = await supabase.from("subcategories").select("*").eq("id", subcatId).maybeSingle();
      subcategory = subcat ?? null;
    }
  }

  // Afbeeldingen ophalen
  const images = Array.isArray(listing.images) ? listing.images : listing.main_photo ? [listing.main_photo] : [];

  // ...existing code...
  // Vervang de bestaande ListingPage implementatie door de opgehaalde data
  // Je bestaande UI hieronder, met extra categorie/subcategorie info:
  return (
    <div className="container py-12 max-w-5xl mx-auto">
  {/* Lint bovenaan met terugknop als Client Component */}
  <BackBar />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Linker hoofdcontainer */}
        <div className="md:col-span-2 flex flex-col gap-8">
          {/* Afbeeldingen container */}
          <div className="relative rounded-2xl border bg-white shadow p-6 w-full mb-2">
            <ImageGallery images={images} title={listing.title} />
            <div className="absolute top-4 right-4 z-10">
              <ListingStats id={listing.id} views={listing.views ?? 0} favorites={listing.favorites ?? 0} />
            </div>
          </div>
          <section className="rounded-2xl border bg-white shadow p-8 w-full flex flex-col gap-8">
            {/* Product info */}
            <div className="border-b pb-6 mb-6">
              {/* Biedingen info */}
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm text-gray-600">Aantal biedingen: {bidCount}</span>
                <span className="text-sm text-emerald-700 font-semibold">Hoogste bod: {highestBid ? `€ ${highestBid}` : "—"}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-2xl font-semibold text-emerald-700">€ {listing.price}</span>
                <span className="text-sm px-3 py-1 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                  {listing.status ?? "Onbekend"}
                </span>
              </div>
              <div className="text-base text-gray-600 mb-2">
                <span>{category ? category.name : "—"}</span>
                {subcategory ? <span> &bull; {subcategory.name}</span> : null}
              </div>
              <div className="text-xs text-gray-400">Geplaatst op: {listing.created_at ? new Date(listing.created_at).toLocaleDateString("nl-BE") : "Onbekend"}</div>
            </div>
            {/* Beschrijving */}
            <div className="border-b pb-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Beschrijving</h2>
              <p className="text-gray-700 whitespace-pre-line text-base">{listing.description ?? "Geen beschrijving opgegeven."}</p>
            </div>
            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b pb-6 mb-6">
              <div>
                <span className="block text-xs text-gray-500 mb-2">Staat</span>
                <span className="text-base text-gray-700">{listing.state ?? "Onbekend"}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-2">Locatie</span>
                <span className="text-base text-gray-700">{listing.location ?? "Onbekend"}</span>
              </div>
            </div>
            {/* Acties */}
            <div className="mb-6">
              <ClientActions
                listingId={listing.id}
                price={listing.price}
                sellerId={listing.seller?.id ?? null}
                  allowOffers={listing.allowOffers}
              />
            </div>
          </section>
        </div>
        {/* Verkoper info rechts */}
        <div className="md:col-span-1">
          <SellerPanels seller={listing.seller} location={listing.location} coords={listing.coords ?? null} />
        </div>
      </div>
    </div>
  );
}

