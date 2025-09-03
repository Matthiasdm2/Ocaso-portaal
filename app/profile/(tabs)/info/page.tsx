'use client';

import React, { useEffect, useState } from 'react';

import type { Profile } from '@/lib/profiletypes';
import { createClient } from '@/lib/supabaseClient';

/* ------------------------- helpers ------------------------- */
function splitName(full?: string) {
  const s = (full || '').trim();
  if (!s) return { firstName: '', lastName: '' };
  const parts = s.split(' ');
  return {
    firstName: parts.slice(0, -1).join(' ') || parts[0],
    lastName: parts.length > 1 ? parts.slice(-1).join(' ') : '',
  };
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
    isBusiness: false,
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

/* ------------------------- page ------------------------- */
export default function InfoPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let ui: Profile = { ...emptyProfile, id: user.id, email: user.email || '' };

      try {
        const { data: r } = await supabase
          .from('profiles')
          .select(`
            id, email, full_name, phone, avatar_url, bio,
            address, preferences, notifications
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
            avatarUrl: r.avatar_url ?? '',
            bio: r.bio ?? '',
            address: {
              street: r.address?.street ?? '',
              city: r.address?.city ?? '',
              zip: r.address?.zip ?? '',
              country: r.address?.country ?? 'België',
            },
            preferences: {
              language: r.preferences?.language ?? 'nl',
              newsletter: r.preferences?.newsletter ?? false,
            },
            notifications: {
              newMessages: r.notifications?.newMessages ?? true,
              bids: r.notifications?.bids ?? true,
              priceDrops: r.notifications?.priceDrops ?? true,
              tips: r.notifications?.tips ?? true,
            },
          };
        }
      } catch (e) {
        console.error('Profiel laden mislukt:', e);
      }

      setProfile(ui);
      setLoading(false);
    })();
  }, [supabase]);

  async function save() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');
      const payload: Profile = {
        ...profile,
        id: user.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl || '',
        bio: profile.bio || '',
        address: {
          street: profile.address.street,
          city: profile.address.city,
          zip: profile.address.zip,
          country: profile.address.country,
        },
        preferences: profile.preferences,
        notifications: profile.notifications,
        business: profile.business,
      };
      // Add full_name and updated_at separately if needed by your backend
      const upsertPayload = {
        ...payload,
        full_name: [profile.firstName?.trim(), profile.lastName?.trim()].filter(Boolean).join(' '),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').upsert(upsertPayload);
      if (error) throw error;
    } catch (e) {
      console.error('Opslaan mislukt:', e);
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------- UI ------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white">
      {/* HERO */}
      <header className="relative border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.08),transparent_35%)]" />
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl || '/placeholder.png'}
              alt="avatar"
              className="h-16 w-16 rounded-2xl border border-emerald-100 object-cover shadow-sm md:h-20 md:w-20"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Profiel</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                Mijn gegevens
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                Alles wat je bij de registratie invulde, overzichtelijk in één plaats. Werk je gegevens bij en sla op.
              </p>
            </div>
            <div className="ms-auto">
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
        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-6">
            <SkeletonCard h={90} />
            <SkeletonCard h={220} />
            <SkeletonCard h={220} />
          </div>
        ) : !profile.id ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-600">Je bent niet aangemeld.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Persoonsgegevens */}
            <Section
              overline="Sectie"
              title="Persoonsgegevens"
              subtitle="Basisinfo die we gebruiken voor je account en communicatie."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Voornaam">
                  <Input
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                </Field>
                <Field label="Achternaam">
                  <Input
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </Field>
                <Field label="E-mail (login)">
                  <Input value={profile.email} disabled />
                </Field>
                <Field label="Telefoon">
                  <Input
                    placeholder="+32 4xx xx xx xx"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-5">
                <Field label="Korte bio (optioneel)">
                  <Textarea
                    rows={3}
                    placeholder="Vertel iets over jezelf (max. 200 tekens)…"
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </Field>
              </div>
            </Section>

            {/* Adres */}
            <Section
              overline="Adres"
              title="Facturatie & verzending"
              subtitle="Wordt gebruikt voor leveringen, ophalen en facturatie."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Straat + nr.">
                  <Input
                    value={profile.address.street}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        address: { ...profile.address, street: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Postcode">
                  <Input
                    value={profile.address.zip}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        address: { ...profile.address, zip: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Gemeente / Stad">
                  <Input
                    value={profile.address.city}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        address: { ...profile.address, city: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Land">
                  <Input
                    value={profile.address.country}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        address: { ...profile.address, country: e.target.value },
                      })
                    }
                  />
                </Field>
              </div>
            </Section>

            {/* Voorkeuren */}
            <Section
              overline="Voorkeuren"
              title="Taal & e-mailupdates"
              subtitle="Kies je weergavetaal en of je nieuwsbrieven wil ontvangen."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Taal">
                  <Select
                    value={profile.preferences.language}
                    onChange={(v: string) =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, language: v },
                      })
                    }
                    options={[
                      { value: 'nl', label: 'Nederlands' },
                      { value: 'fr', label: 'Français' },
                      { value: 'en', label: 'English' },
                      { value: 'de', label: 'Deutsch' },
                    ]}
                  />
                </Field>
                <Field label="Nieuwsbrief">
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-emerald-600"
                      checked={!!profile.preferences.newsletter}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            newsletter: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-sm text-neutral-700">
                      Ja, ik ontvang tips & updates van OCASO
                    </span>
                  </label>
                </Field>
              </div>
            </Section>

            {/* Save bar */}
            <div className="flex justify-end">
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
    </div>
  );
}

/* ------------------------- atoms (Over-OCASO-style) ------------------------- */
function Section({
  overline,
  title,
  subtitle,
  children,
}: {
  overline?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-5">
        {overline ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
            {overline}
          </div>
        ) : null}
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
        ) : null}
        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
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
      className={`w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition
                  placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-200`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition
                  placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-200`}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value?: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-200"
    >
      <option value="" disabled>
        Maak een keuze…
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
