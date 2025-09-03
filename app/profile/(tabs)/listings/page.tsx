'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { createClient } from '@/lib/supabaseClient';

/* ----------------------------- types & utils ----------------------------- */
type Listing = {
    id: string;
    title: string;
    price?: number | null;
    currency?: string | null;
    cover_url?: string | null;
    category?: string | null;
    condition?: string | null;
    created_at?: string | null;
    status?: 'active' | 'paused' | 'sold' | 'draft' | string | null;
    sold?: boolean | null;
    sold_via_ocaso?: boolean | null;
    views?: number | null;
    saves?: number | null;
    bids?: number | null;
    highest_bid?: number | null;
    last_bid_at?: string | null;
    location?: string | null;
    allow_offers?: boolean | null;
};

function formatCurrency(v?: number | null, ccy = 'EUR') {
    if (v == null) return '—';
    return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: ccy }).format(v);
}
function sum(arr: Array<number | null | undefined>) {
    return arr.reduce((acc: number, x) => acc + (x ?? 0), 0);
}
function clsx(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(' ');
}

/* ---------------------------------- page --------------------------------- */
export default function ListingsPage() {
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    // const [userId, setUserId] = useState<string | null>(null); // Removed unused variable

    const [items, setItems] = useState<Listing[]>([]);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold' | 'paused' | 'draft'>('all');
    const [sort, setSort] = useState<'new' | 'views' | 'bids' | 'price-asc' | 'price-desc'>('new');
    const [busyIds, setBusyIds] = useState<Record<string, boolean>>({}); // row-level spinners

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    setErr('Je bent niet aangemeld.');
                    return;
                }
                // setUserId(user.id); // Removed unused variable

                const url = `/api/profile/listings?seller_id=${encodeURIComponent(user.id)}&include=metrics=1`;
                const r = await fetch(url);
                if (!r.ok) throw new Error(`Server ${r.status}`);
                const d = await r.json();
                const rows: Listing[] = (d.items || []).map((x: Partial<Listing> & { images?: { url?: string }[]; metrics?: { views?: number; saves?: number; bids?: number; highest_bid?: number; last_bid_at?: string }; sale_channel?: string }) => ({
                    id: x.id ?? '',
                    title: x.title ?? '—',
                    price: x.price ?? null,
                    currency: x.currency ?? 'EUR',
                    cover_url: x.cover_url ?? x.images?.[0]?.url ?? null,
                    category: x.category ?? null,
                    condition: x.condition ?? null,
                    created_at: x.created_at ?? null,
                    status: x.status ?? (x.sold ? 'sold' : 'active'),
                    sold: x.sold ?? (x.status === 'sold'),
                    sold_via_ocaso: x.sold_via_ocaso ?? (x.sale_channel === 'ocaso'),
                    views: x.views ?? x.metrics?.views ?? 0,
                    saves: x.saves ?? x.metrics?.saves ?? 0,
                    bids: x.bids ?? x.metrics?.bids ?? 0,
                    highest_bid: x.highest_bid ?? x.metrics?.highest_bid ?? null,
                    last_bid_at: x.last_bid_at ?? x.metrics?.last_bid_at ?? null,
                    location: x.location ?? null,
                    allowOffers: x.allow_offers ?? false,
                }));
                setItems(rows);
            } catch (e) {
                console.error(e);
                setErr('Kon zoekertjes niet laden.');
            } finally {
                setLoading(false);
            }
        })();
    }, [supabase]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let rows = items.filter((it) => (q ? (it.title || '').toLowerCase().includes(q) : true));
        if (statusFilter !== 'all') {
            rows = rows.filter((it) => {
                const st = (it.status || '').toLowerCase();
                if (statusFilter === 'active') return st === 'active';
                if (statusFilter === 'sold') return st === 'sold' || !!it.sold;
                if (statusFilter === 'paused') return st === 'paused';
                if (statusFilter === 'draft') return st === 'draft';
                return true;
            });
        }
        switch (sort) {
            case 'new':
                rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
                break;
            case 'views':
                rows.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'bids':
                rows.sort((a, b) => (b.bids || 0) - (a.bids || 0));
                break;
            case 'price-asc':
                rows.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 'price-desc':
                rows.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
        }
        return rows;
    }, [items, query, statusFilter, sort]);

    const metrics = useMemo(() => {
        const total = items.length;
        const active = items.filter((x) => (x.status || '').toLowerCase() === 'active').length;
        const sold = items.filter((x) => (x.sold || (x.status || '').toLowerCase() === 'sold')).length;
        const views = sum(items.map((x) => x.views));
        return { total, active, sold, views };
    }, [items]);

    async function updateFlags(id: string, patch: Partial<Pick<Listing, 'sold' | 'sold_via_ocaso' | 'status'>>) {
        setBusyIds((m) => ({ ...m, [id]: true }));
        try {
            const res = await fetch('/api/listings/flags', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ id, ...patch }),
            });
            if (!res.ok) throw new Error('Flags opslaan mislukt');
            setItems((prev) =>
                prev.map((l) =>
                    l.id === id
                        ? {
                            ...l,
                            sold: patch.sold ?? l.sold,
                            sold_via_ocaso: patch.sold_via_ocaso ?? l.sold_via_ocaso,
                            status:
                                patch.status ?? (
                                    patch.sold === true
                                        ? 'sold'
                                        : patch.sold === false && (l.status === 'sold' || l.sold)
                                            ? 'active'
                                            : l.status
                                ),
                        }
                        : l
                )
            );
        } catch (e) {
            alert('Bewaren mislukt. Probeer opnieuw.');
        } finally {
            setBusyIds((m) => ({ ...m, [id]: false }));
        }
    }

    async function removeListing(id: string) {
        if (!confirm('Dit zoekertje verwijderen?')) return;
        setBusyIds((m) => ({ ...m, [id]: true }));
        try {
            const res = await fetch(`/api/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Verwijderen mislukt');
            setItems((prev) => prev.filter((x) => x.id !== id));
        } catch (e) {
            alert('Verwijderen mislukt. Probeer opnieuw.');
        } finally {
            setBusyIds((m) => ({ ...m, [id]: false }));
        }
    }

    /* ---------------------------------- UI ---------------------------------- */
    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white">
            {/* HERO */}
            <header className="relative border-b">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.08),transparent_35%)]" />
                <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                            Profiel
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mijn zoekertjes</h1>
                        <p className="max-w-2xl text-sm text-neutral-600">
                            Bekijk prestaties en beheer je zoekertjes. Raadpleeg snel bezoekers, favorieten, biedingen en verkoopstatus.
                        </p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
                {/* Loading / error */}
                {loading ? (
                    <div className="space-y-6">
                        <SkeletonCard h={80} />
                        <SkeletonCard h={300} />
                    </div>
                ) : err ? (
                    <div className="rounded-2xl border bg-white p-6 shadow-sm">{err}</div>
                ) : (
                    <>
                        {/* Stats */}
                        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard label="Totaal" value={metrics.total} />
                            <StatCard label="Actief" value={metrics.active} />
                            <StatCard label="Verkocht" value={metrics.sold} />
                            <StatCard label="Bezoekers" value={metrics.views ?? 0} />
                        </section>

                        {/* Controls */}
                        <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="flex-1">
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Zoek op titel…"
                                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-200"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(['all', 'active', 'sold', 'paused', 'draft'] as const).map((k) => (
                                        <button
                                            key={k}
                                            onClick={() => setStatusFilter(k)}
                                            className={clsx(
                                                'rounded-full px-3 py-1.5 text-sm border transition',
                                                statusFilter === k
                                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                                            )}
                                        >
                                            {k === 'all' ? 'Alle' :
                                                k === 'active' ? 'Actief' :
                                                    k === 'sold' ? 'Verkocht' :
                                                        k === 'paused' ? 'Pauze' : 'Concept'}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value as 'new' | 'views' | 'bids' | 'price-asc' | 'price-desc')}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-200"
                                    >
                                        <option value="new">Nieuwste eerst</option>
                                        <option value="views">Meeste bezoekers</option>
                                        <option value="bids">Meeste biedingen</option>
                                        <option value="price-asc">Prijs ↑</option>
                                        <option value="price-desc">Prijs ↓</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Table */}
                        {filtered.length === 0 ? (
                            <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-600 shadow-sm">
                                Geen zoekertjes gevonden.
                            </div>
                        ) : (
                            <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                                <div className="hidden w-full min-w-[960px] md:block">
                                    <table className="w-full table-fixed">
                                        <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
                                            <tr>
                                                <th className="px-3 py-3 text-left w-[72px]">Foto</th>
                                                <th className="px-3 py-3 text-left">Titel</th>
                                                <th className="px-3 py-3 text-right w-28">Prijs</th>
                                                <th className="px-3 py-3 text-center w-24">Bezoekers</th>
                                                <th className="px-3 py-3 text-center w-24">Opgeslagen</th>
                                                <th className="px-3 py-3 text-center w-32">Biedingen</th>
                                                <th className="px-3 py-3 text-center w-28">Status</th>
                                                <th className="px-3 py-3 text-center w-36">Verkocht / via OCASO</th>
                                                <th className="px-3 py-3 text-right w-40">Acties</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filtered.map((it) => (
                                                <tr key={it.id} className="align-middle">
                                                    <td className="px-3 py-3">
                                                        <Link href={`/listings/${it.id}`} passHref legacyBehavior>
                                                            <a className="block">
                                                                <Thumb url={it.cover_url} />
                                                            </a>
                                                        </Link>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Link href={`/listings/${it.id}`} passHref legacyBehavior>
                                                            <a className="truncate text-sm font-medium hover:underline block">{it.title}</a>
                                                        </Link>
                                                        <div className="mt-0.5 text-xs text-neutral-500">
                                                            {it.category || '—'} • {it.condition || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-sm tabular-nums">
                                                        {formatCurrency(it.price ?? null, it.currency || 'EUR')}
                                                    </td>
                                                    <td className="px-3 py-3 text-center text-sm tabular-nums">{it.views ?? 0}</td>
                                                    <td className="px-3 py-3 text-center text-sm tabular-nums">{it.saves ?? 0}</td>
                                                    <td className="px-3 py-3 text-center text-sm">
                                                        <div className="tabular-nums">{it.bids ?? 0}{(it.allow_offers ?? true) ? '' : ' (uit)'}</div>
                                                        <div className="text-xs text-neutral-500">
                                                            Hoogste: {it.highest_bid != null ? formatCurrency(it.highest_bid, it.currency || 'EUR') : '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <StatusBadge status={(it.status || '').toLowerCase()} />
                                                    </td>
                                                    <td className="px-3 py-3 align-middle">
                                                        <div className="flex flex-col items-center justify-center gap-2 w-36 h-full">
                                                            <label className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-xs">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!it.sold}
                                                                    disabled={!!busyIds[it.id]}
                                                                    onChange={(e) => updateFlags(it.id, { sold: e.target.checked })}
                                                                    className="h-4 w-4 accent-emerald-600 rounded-full border border-gray-300 bg-white transition-shadow focus:ring-2 focus:ring-emerald-200 hover:shadow"
                                                                />
                                                                <span className="ml-1 select-none">Verkocht</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-xs">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!it.sold_via_ocaso}
                                                                    disabled={!!busyIds[it.id]}
                                                                    onChange={(e) => updateFlags(it.id, { sold_via_ocaso: e.target.checked })}
                                                                    className="h-4 w-4 accent-emerald-600 rounded-full border border-gray-300 bg-white transition-shadow focus:ring-2 focus:ring-emerald-200 hover:shadow"
                                                                />
                                                                <span className="ml-1 select-none">via OCASO</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 align-top">
                                                        <div className="flex flex-col items-stretch gap-2 w-36">
                                                            <button
                                                                onClick={() => updateFlags(it.id, { status: it.status === 'paused' ? 'active' : 'paused' })}
                                                                disabled={!!busyIds[it.id]}
                                                                className={`rounded-full px-3 py-1 text-sm w-full text-center transition ${it.status === 'paused' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'} disabled:opacity-50`}
                                                            >
                                                                {it.status === 'paused' ? 'Activeren' : 'Pauzeren'}
                                                            </button>
                                                            <Link
                                                                href={`/listings/${it.id}`}
                                                                className="rounded-full px-3 py-1 text-sm w-full text-center bg-gray-100 hover:bg-gray-200 transition"
                                                            >
                                                                Bewerken
                                                            </Link>
                                                            <button
                                                                onClick={() => removeListing(it.id)}
                                                                disabled={!!busyIds[it.id]}
                                                                className="rounded-full px-3 py-1 text-sm w-full text-center bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                                            >
                                                                Verwijderen
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile cards */}
                                <div className="block md:hidden">
                                    {filtered.map((it) => (
                                        <div key={it.id} className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Link href={`/listings/${it.id}`} passHref legacyBehavior>
                                                    <a className="block">
                                                        <Thumb url={it.cover_url} />
                                                    </a>
                                                </Link>
                                                <div className="min-w-0">
                                                    <Link href={`/listings/${it.id}`} passHref legacyBehavior>
                                                        <a className="truncate text-sm font-medium hover:underline block">{it.title}</a>
                                                    </Link>
                                                    <div className="text-xs text-neutral-500">
                                                        {formatCurrency(it.price ?? null, it.currency || 'EUR')}
                                                    </div>
                                                </div>
                                                <StatusBadge status={(it.status || '').toLowerCase()} className="ms-auto" />
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                                <Metric label="Bezoekers" value={it.views ?? 0} />
                                                <Metric label="Opgeslagen" value={it.saves ?? 0} />
                                                <Metric
                                                    label="Biedingen"
                                                    value={
                                                        it.highest_bid != null
                                                            ? `${it.bids ?? 0} • ${formatCurrency(it.highest_bid, it.currency || 'EUR')}`
                                                            : (it.bids ?? 0)
                                                    }
                                                />
                                            </div>
                                            <div className="mt-3 flex flex-col gap-2 w-36">
                                                <button
                                                    onClick={() => updateFlags(it.id, { status: it.status === 'paused' ? 'active' : 'paused' })}
                                                    disabled={!!busyIds[it.id]}
                                                    className={`rounded-full px-3 py-1 text-sm w-full text-center transition ${it.status === 'paused' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'} disabled:opacity-50`}
                                                >
                                                    {it.status === 'paused' ? 'Activeren' : 'Pauzeren'}
                                                </button>
                                                <Link
                                                    href={`/listings/${it.id}`}
                                                    className="rounded-full px-3 py-1 text-sm w-full text-center bg-gray-100 hover:bg-gray-200 transition"
                                                >
                                                    Bewerken
                                                </Link>
                                                <button
                                                    onClick={() => removeListing(it.id)}
                                                    disabled={!!busyIds[it.id]}
                                                    className="rounded-full px-3 py-1 text-sm w-full text-center bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                                >
                                                    Verwijderen
                                                </button>
                                                <label className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!it.sold}
                                                        disabled={!!busyIds[it.id]}
                                                        onChange={(e) => updateFlags(it.id, { sold: e.target.checked })}
                                                        className="h-4 w-4 accent-emerald-600 rounded-full border border-gray-200 bg-white"
                                                    />
                                                    <span className="ml-1">Verkocht</span>
                                                </label>
                                                <label className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!it.sold_via_ocaso}
                                                        disabled={!!busyIds[it.id]}
                                                        onChange={(e) => updateFlags(it.id, { sold_via_ocaso: e.target.checked })}
                                                        className="h-4 w-4 accent-emerald-600 rounded-full border border-gray-200 bg-white"
                                                    />
                                                    <span className="ml-1">via OCASO</span>
                                                </label>
                                                <button
                                                    onClick={() => updateFlags(it.id, { status: it.status === 'paused' ? 'active' : 'paused' })}
                                                    disabled={!!busyIds[it.id]}
                                                    className={`w-full rounded-lg border px-3 py-1.5 text-sm ${it.status === 'paused' ? 'border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50' : 'border-yellow-200 text-yellow-700 bg-white hover:bg-yellow-50'} disabled:opacity-50`}
                                                >
                                                    {it.status === 'paused' ? 'Activeren' : 'Pauzeren'}
                                                </button>
                                                <Link
                                                    href={`/listings/${it.id}/edit`}
                                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
                                                >
                                                    Bewerken
                                                </Link>
                                                <button
                                                    onClick={() => removeListing(it.id)}
                                                    disabled={!!busyIds[it.id]}
                                                    className="w-full rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Verwijderen
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

/* --------------------------------- atoms --------------------------------- */
function SkeletonCard({ h = 180 }: { h?: number }) {
    return (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="h-10 w-full bg-neutral-50" />
            <div className="p-6">
                <div className="h-4 w-40 rounded bg-neutral-100" />
                <div className="mt-4 h-[1px] w-full bg-neutral-100" />
                <div className="mt-4" style={{ height: h }}>
                    <div className="h-full w-full rounded bg-neutral-50" />
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                {label}
            </div>
            <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
            <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
        </div>
    );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-lg border bg-neutral-50 p-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">{label}</div>
            <div className="mt-1 text-sm font-medium">{value}</div>
        </div>
    );
}

function Thumb({ url }: { url?: string | null }) {
    return (
        <div className="h-14 w-14 overflow-hidden rounded-md border bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url || '/placeholder.png'}
                alt=""
                className="h-full w-full object-cover"
            />
        </div>
    );
}

function StatusBadge({ status, className }: { status: string; className?: string }) {
    const map: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700',
        sold: 'bg-neutral-200 text-neutral-700',
        paused: 'bg-amber-100 text-amber-700',
        draft: 'bg-blue-100 text-blue-700',
    };
    const label: Record<string, string> = {
        active: 'Actief',
        sold: 'Verkocht',
        paused: 'Pauze',
        draft: 'Concept',
    };
    const cls = map[status] || 'bg-neutral-100 text-neutral-700';
    return (
        <span className={clsx('inline-flex items-center rounded-full px-2 py-1 text-xs', cls, className)}>
            {label[status] || status || '—'}
        </span>
    );
}
