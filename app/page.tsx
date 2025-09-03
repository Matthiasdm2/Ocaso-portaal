import FilterTabs from "@/components/FilterTabs";
import HeroSearch from "@/components/HeroSearch";
import InfiniteGrid from "@/components/InfiniteGrid";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

async function getHomeData(): Promise<{
  sponsored: Listing[];
  recommended: Listing[];
}> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/home`,
    { cache: "no-store" },
  );
  return res.json();
}

export default async function HomePage() {
  const { sponsored, recommended } = await getHomeData();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <HeroSearch />

      {/* Snel naar… */}
      <section className="container space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Categorieën</h2>
          <a
            href="/categories"
            className="text-sm text-gray-600 hover:underline"
          >
            Alles bekijken
          </a>
        </div>

        <section className="container">
          <div className="card p-6 md:p-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Categorieën</h2>
              <p className="text-sm text-gray-600">
                Bekijk alle hoofdcategorieën en subcategorieën.
              </p>
            </div>
            <a
              href="/categories"
              className="rounded-xl bg-primary text-black px-4 py-2 font-medium"
            >
              Naar categorieën
            </a>
          </div>
        </section>
      </section>

      {/* Gesponsord */}
      <section className="container space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gesponsorde zoekertjes</h2>
          <a
            href="/sponsored"
            className="text-sm text-gray-600 hover:underline"
          >
            Bekijk alle
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sponsored.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Recent toegevoegd (eerste batch aanbevelingen) */}
      <section className="container space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent toegevoegd</h2>
          <a href="/recent" className="text-sm text-gray-600 hover:underline">
            Meer
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {recommended.slice(0, 20).map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Aanbevolen met filters + infinite scroll */}
      <section className="container space-y-4 pb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Aanbevolen voor jou</h2>
          <FilterTabs />
        </div>
        <InfiniteGrid />
      </section>

      {/* Tips & Veiligheid */}
      <section className="container">
        <div className="card p-6 md:p-8">
          <h3 className="text-lg font-semibold mb-3">Tips & Veilig handelen</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="card p-4">
              <div className="font-medium mb-1">1. Controleer het profiel</div>
              <p>Bekijk reviews en activiteit van de verkoper of koper.</p>
            </div>
            <div className="card p-4">
              <div className="font-medium mb-1">2. Betaal veilig</div>
              <p>
                Gebruik betrouwbare betaalmethodes en betaal nooit buiten het
                platform.
              </p>
            </div>
            <div className="card p-4">
              <div className="font-medium mb-1">
                3. Spreek af op een veilige plek
              </div>
              <p>
                Kies drukke, publieke locaties of maak gebruik van
                verzendservice.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
