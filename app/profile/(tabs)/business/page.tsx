'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { Profile } from '@/lib/profiletypes';
import { createClient } from '@/lib/supabaseClient';

/* -------------------------------- helpers -------------------------------- */
function splitName(full?: string) {
  const s = (full || '').trim();
  if (!s) return { firstName: '', lastName: '' };
  const parts = s.split(' ');
  return { firstName: parts.slice(0, -1).join(' ') || parts[0], lastName: parts.length > 1 ? parts.slice(-1).join(' ') : '' };
}
function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

const emptyProfile: Profile = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  avatarUrl: '',
  bio: '',
  address: { street: '', city: '', zip: '', country: 'België' },
  preferences: { language: 'nl', newsletter: false },
  notifications: { newMessages: true, bids: true, priceDrops: true, tips: true },
  business: {
    isBusiness: true, // deze pagina is voor zakelijke verkopers
    companyName: '',
    vatNumber: '',
    registrationNr: '',
    website: '',
    invoiceEmail: '',
    bank: { iban: '', bic: '' },
    invoiceAddress: { street: '', city: '', zip: '', country: 'België' },
    plan: 'basic',
    shopName: '',
    shopSlug: '',
    logoUrl: '',
    bannerUrl: '',
    description: '',
    socials: { instagram: '', facebook: '', tiktok: '' },
    public: { showEmail: false, showPhone: false },
  },
};

/* --------------------------------- page ---------------------------------- */
export default function BusinessProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState<null | 'ok' | 'taken' | 'err'>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  // NEW: modal state voor preview
  const [showPreview, setShowPreview] = useState(false);

  // Load huidige gebruiker + profiel
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      let ui: Profile = { ...emptyProfile, id: user.id, email: user.email || '' };

      try {
        const { data: r } = await supabase
          .from('profiles')
          .select(`
            id, email, full_name, phone,
            is_business, company_name, vat, registration_nr, website, invoice_email,
            bank, invoice_address,
            shop_name, shop_slug,
            business_logo_url, business_banner_url,
            business_bio,
            social_instagram, social_facebook, social_tiktok,
            public_show_email, public_show_phone
          `)
          .eq('id', user.id)
          .maybeSingle();

        if (r) {
          const name = splitName(r.full_name);
          ui = {
            ...ui,
            firstName: name.firstName,
            lastName: name.lastName,
            email: r.email ?? user.email ?? '',
            phone: r.phone ?? '',
            business: {
              ...ui.business,
              isBusiness: !!r.is_business,
              companyName: r.company_name ?? '',
              vatNumber: r.vat ?? '',
              registrationNr: r.registration_nr ?? '',
              website: r.website ?? '',
              invoiceEmail: r.invoice_email ?? '',
              bank: { iban: r.bank?.iban ?? '', bic: r.bank?.bic ?? '' },
              invoiceAddress: {
                street: r.invoice_address?.street ?? '',
                city: r.invoice_address?.city ?? '',
                zip: r.invoice_address?.zip ?? '',
                country: r.invoice_address?.country ?? 'België',
              },
              shopName: r.shop_name ?? '',
              shopSlug: r.shop_slug ?? '',
              logoUrl: r.business_logo_url ?? '',
              bannerUrl: r.business_banner_url ?? '',
              description: r.business_bio ?? '',
              socials: {
                instagram: r.social_instagram ?? '',
                facebook: r.social_facebook ?? '',
                tiktok: r.social_tiktok ?? '',
              },
              public: {
                showEmail: !!r.public_show_email,
                showPhone: !!r.public_show_phone,
              },
            },
          };
        }
      } catch (e) {
        console.error('Business-profiel laden mislukt:', e);
      }

      setProfile(ui);
      setLoading(false);
    })();
  }, [supabase]);

  // Opslaan naar Supabase
  async function save() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const b = profile.business;
      interface BusinessPayload {
        id: string;
        is_business: boolean;
        company_name: string | null;
        vat: string | null;
        registration_nr: string | null;
        website: string | null;
        invoice_email: string | null;
        bank: { iban: string; bic: string };
        invoice_address: { street: string; city: string; zip: string; country: string };
        shop_name: string | null;
        shop_slug: string | null;
        business_logo_url: string | null;
        business_banner_url: string | null;
        business_bio: string | null;
        social_instagram: string | null;
        social_facebook: string | null;
        social_tiktok: string | null;
        public_show_email: boolean;
        public_show_phone: boolean;
        updated_at: string;
      }

      const payload: BusinessPayload = {
        id: user.id,
        // business velden
        is_business: true,
        company_name: b.companyName || null,
        vat: b.vatNumber || null,
        registration_nr: b.registrationNr || null,
        website: b.website || null,
        invoice_email: b.invoiceEmail || null,
        bank: { iban: b.bank.iban, bic: b.bank.bic },
        invoice_address: {
          street: b.invoiceAddress.street,
          city: b.invoiceAddress.city,
          zip: b.invoiceAddress.zip,
          country: b.invoiceAddress.country,
        },
        shop_name: b.shopName || null,
        shop_slug: b.shopSlug || null,
        business_logo_url: b.logoUrl || null,
        business_banner_url: b.bannerUrl || null,
        business_bio: b.description || null,
        social_instagram: b.socials.instagram || null,
        social_facebook: b.socials.facebook || null,
        social_tiktok: b.socials.tiktok || null,
        public_show_email: !!b.public.showEmail,
        public_show_phone: !!b.public.showPhone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;
    } catch (e) {
      console.error('Opslaan mislukt:', e);
    } finally {
      setSaving(false);
    }
  }

  // Uploads (logo & banner)
  async function uploadTo(bucket: string, file: File, setUrl: (u: string | null) => void) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data?.publicUrl ?? null);
    } catch (e) {
      alert('Upload mislukt. Probeer opnieuw.');
    }
  }

  // Slug validatie
  const checkSlug = useRef<number | null>(null);
  function onShopNameChange(v: string) {
    const nextSlug = profile.business.shopSlug ? profile.business.shopSlug : slugify(v);
    setProfile(p => ({ ...p, business: { ...p.business, shopName: v, shopSlug: nextSlug } }));
    setCheckingSlug(null);
  }
  function onShopSlugChange(v: string) {
    const s = slugify(v);
    setProfile(p => ({ ...p, business: { ...p.business, shopSlug: s } }));
    setCheckingSlug(null);
    if (checkSlug.current) clearTimeout(checkSlug.current);
    checkSlug.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/business/slug-available?slug=${encodeURIComponent(s)}`);
        if (!r.ok) { setCheckingSlug(null); return; }
        const d = await r.json();
        setCheckingSlug(d?.available ? 'ok' : 'taken');
      } catch {
        setCheckingSlug('err');
      }
    }, 500);
  }

  const verified = useMemo(() => {
    const b = profile.business;
    return !!(b.vatNumber && b.registrationNr && b.companyName);
  }, [profile.business]);

  /* ---------------------------------- UI ---------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white">
      {/* HERO */}
      <header className="relative border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.08),transparent_35%)]" />
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Profiel</p>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Zakelijk profiel</h1>
              <p className="max-w-2xl text-sm text-neutral-600">
                Ontwerp jouw publieke winkelpagina. Deze info is zichtbaar voor kopers op OCASO.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
              >
                Preview zakelijk profiel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        {loading ? (
          <div className="space-y-6">
            <SkeletonCard h={120} />
            <SkeletonCard h={280} />
            <SkeletonCard h={260} />
            <SkeletonCard h={200} />
          </div>
        ) : !profile.id ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">Je bent niet aangemeld.</div>
        ) : (
          <div className="space-y-10">
            {/* Branding */}
            <Section overline="Branding" title="Logo & banner" subtitle="Upload je bedrijfslogo en header-afbeelding.">
              <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Logo</div>
                  <div className="flex items-center gap-3">
                    <ThumbLarge url={profile.business.logoUrl} rounded />
                    <button
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
                      onClick={() => document.getElementById('logo-input')?.click()}
                    >
                      Upload logo
                    </button>
                    <input
                      id="logo-input"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadTo('business-logos', f, (u) => setProfile(p => ({ ...p, business: { ...p.business, logoUrl: u || '' } })));
                      }}
                    />
                    {profile.business.logoUrl ? (
                      <button
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
                        onClick={() => setProfile(p => ({ ...p, business: { ...p.business, logoUrl: '' } }))}
                      >
                        Verwijderen
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Banner</div>
                  <div className="overflow-hidden rounded-2xl border bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.business.bannerUrl || '/placeholder.png'}
                      alt="banner"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
                      onClick={() => document.getElementById('banner-input')?.click()}
                    >
                      Upload banner
                    </button>
                    <input
                      id="banner-input"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadTo('business-covers', f, (u) => setProfile(p => ({ ...p, business: { ...p.business, bannerUrl: u || '' } })));
                      }}
                    />
                    {profile.business.bannerUrl ? (
                      <button
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
                        onClick={() => setProfile(p => ({ ...p, business: { ...p.business, bannerUrl: '' } }))}
                      >
                        Verwijderen
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Section>

            {/* Winkelgegevens */}
            <Section overline="Winkel" title="Winkelgegevens" subtitle="Kies je publieksnaam en URL-slug (uniek).">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Shopnaam (publiek)">
                  <Input
                    value={profile.business.shopName}
                    onChange={(e) => onShopNameChange(e.target.value)}
                    placeholder="Bv. Retro Vinyl Store"
                  />
                </Field>
                <Field label="Slug (url)">
                  <div className="flex items-center gap-2">
                    <Input
                      value={profile.business.shopSlug}
                      onChange={(e) => onShopSlugChange(e.target.value)}
                      placeholder="bv. retro-vinyl-store"
                    />
                    <SlugStatus state={checkingSlug} />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">Wordt zichtbaar als /shop/<strong>{profile.business.shopSlug || 'jouw-slug'}</strong></p>
                </Field>
                <Field label="Website">
                  <Input
                    value={profile.business.website}
                    onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, website: e.target.value } }))}
                    placeholder="https://"
                  />
                </Field>
                <Field label="Publieke beschrijving (over ons)">
                  <Textarea
                    rows={4}
                    value={profile.business.description || ''}
                    onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, description: e.target.value } }))}
                    placeholder="Beschrijf je winkel, specialisaties en service…"
                  />
                </Field>
              </div>
            </Section>

            {/* Zichtbaarheid & contact */}
            <Section overline="Zichtbaarheid" title="Contact & zichtbaarheid" subtitle="Kies wat kopers mogen zien op je winkelpagina.">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Publiek e-mailadres">
                  <Input
                    value={profile.business.invoiceEmail}
                    onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, invoiceEmail: e.target.value } }))}
                    placeholder="contact@bedrijf.be"
                  />
                </Field>
                <Field label="Publiek telefoonnummer">
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+32 4xx xx xx xx"
                  />
                </Field>

                <div className="col-span-full grid gap-3 sm:grid-cols-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-emerald-600"
                      checked={!!profile.business.public.showEmail}
                      onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, public: { ...p.business.public, showEmail: e.target.checked } } }))}
                    />
                    <span className="text-sm">Toon e-mailadres aan kopers</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-emerald-600"
                      checked={!!profile.business.public.showPhone}
                      onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, public: { ...p.business.public, showPhone: e.target.checked } } }))}
                    />
                    <span className="text-sm">Toon telefoonnummer aan kopers</span>
                  </label>
                </div>
              </div>
            </Section>

            {/* Socials */}
            <Section overline="Socials" title="Social media" subtitle="Voeg links toe zodat kopers je kunnen volgen.">
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Instagram">
                  <Input
                    placeholder="@jouwaccount of volledige URL"
                    value={profile.business.socials.instagram}
                    onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, socials: { ...p.business.socials, instagram: e.target.value } } }))}
                  />
                </Field>
                <Field label="Facebook">
                  <Input
                    placeholder="paginanaam of URL"
                    value={profile.business.socials.facebook}
                    onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, socials: { ...p.business.socials, facebook: e.target.value } } }))}
                  />
                </Field>
                <Field label="TikTok">
                  <Input
                    placeholder="@jouwaccount of URL"
                    value={profile.business.socials.tiktok}
                    onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, socials: { ...p.business.socials, tiktok: e.target.value } } }))}
                  />
                </Field>
              </div>
            </Section>

            {/* Wettelijke info */}
            <Section overline="Wettelijk" title="Bedrijfsgegevens" subtitle="Helpt bij vertrouwen & verificatie van je winkel.">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Bedrijfsnaam">
                  <Input
                    value={profile.business.companyName}
                    onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, companyName: e.target.value } }))}
                    placeholder="BV Voorbeeld"
                  />
                </Field>
                <Field label="BTW-nummer (VAT)">
                  <Input
                    value={profile.business.vatNumber}
                    onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, vatNumber: e.target.value } }))}
                    placeholder="BE0123.456.789"
                  />
                </Field>
                <Field label="Ondernemingsnr. (KBO)">
                  <Input
                    value={profile.business.registrationNr}
                    onChange={(e) => setProfile(p => ({ ...p, business: { ...p.business, registrationNr: e.target.value } }))}
                    placeholder="xxxx.xxx.xxx"
                  />
                </Field>
                <div className="rounded-xl border p-3">
                  <div className="text-sm">
                    Verificatie-status:{' '}
                    <span className={verified ? 'text-emerald-700' : 'text-amber-700'}>
                      {verified ? 'Geverifieerd (basis)' : 'Niet geverifieerd'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">
                    Vul bedrijfsnaam, BTW en KBO in voor een basis-verificatiebadge.
                  </p>
                </div>
              </div>
            </Section>

            {/* Opslaan + Preview button onderaan */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
              >
                Preview zakelijk profiel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Preview zakelijk profiel */}
      <PreviewModal open={showPreview} onClose={() => setShowPreview(false)} title="Voorbeeld — Zakelijk profiel">
        <ShopPreview
          name={profile.business.shopName || 'Jouw winkel'}
          slug={profile.business.shopSlug || 'jouw-slug'}
          logo={profile.business.logoUrl}
          banner={profile.business.bannerUrl}
          website={profile.business.website}
          description={profile.business.description}
          showEmail={!!profile.business.public.showEmail}
          showPhone={!!profile.business.public.showPhone}
          email={profile.business.invoiceEmail}
          phone={profile.phone}
          socials={profile.business.socials}
          verified={verified}
        />
      </PreviewModal>
    </div>
  );
}

/* --------------------------------- atoms --------------------------------- */
function Section({
  overline, title, subtitle, children,
}: { overline?: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-5">
        {overline ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">{overline}</div>
        ) : null}
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-200"
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-200"
    />
  );
}
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
function ThumbLarge({ url, rounded = false }: { url?: string | null; rounded?: boolean }) {
  return (
    <div className={`h-20 w-20 overflow-hidden ${rounded ? 'rounded-2xl' : 'rounded-md'} border bg-neutral-100`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url || '/placeholder.png'} alt="" className="h-full w-full object-cover" />
    </div>
  );
}
function SlugStatus({ state }: { state: null | 'ok' | 'taken' | 'err' }) {
  if (!state) return null;
  const map = {
    ok: 'Beschikbaar',
    taken: 'Niet beschikbaar',
    err: 'Onbekend',
  } as const;
  const cls = state === 'ok' ? 'text-emerald-700' : state === 'taken' ? 'text-amber-700' : 'text-neutral-500';
  return <span className={`text-sm ${cls}`}>{map[state]}</span>;
}

/* ------------------------------ modal + preview --------------------------- */
function PreviewModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  // ESC support
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-base font-semibold">{title || 'Preview'}</h3>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm hover:bg-neutral-50"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function ShopPreview({
  name, slug, logo, banner, website, description,
  showEmail, showPhone, email, phone, socials, verified,
}: {
  name: string; slug: string;
  logo?: string | null; banner?: string | null; website?: string | null;
  description?: string | null;
  showEmail: boolean; showPhone: boolean; email?: string | null; phone?: string | null;
  socials: { instagram?: string; facebook?: string; tiktok?: string };
  verified: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="relative">
        {/* Banner */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner || '/placeholder.png'} alt="" className="h-36 w-full object-cover" />
        {/* Logo */}
        <div className="absolute -bottom-8 left-6 h-16 w-16 overflow-hidden rounded-2xl border-4 border-white shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo || '/placeholder.png'} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="px-6 pb-6 pt-10">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold tracking-tight">{name}</h3>
          {verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
              ✓ Geverifieerd
            </span>
          )}
          <span className="ms-auto text-xs text-neutral-500">/shop/{slug}</span>
        </div>

        {description ? <p className="mt-2 text-sm text-neutral-700">{description}</p> : null}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          {website ? (
            <span className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1">🌐 <span className="truncate max-w-[200px]">{website}</span></span>
          ) : null}
          {showEmail && email ? <span className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1">✉️ {email}</span> : null}
          {showPhone && phone ? <span className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1">📞 {phone}</span> : null}
          {socials?.instagram ? <span className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1">📸 {socials.instagram}</span> : null}
          {socials?.facebook ? <span className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1">📘 {socials.facebook}</span> : null}
          {socials?.tiktok ? <span className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1">🎵 {socials.tiktok}</span> : null}
        </div>
      </div>
    </div>
  );
}
