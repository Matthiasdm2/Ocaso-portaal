"use client";

import Link from "next/link";
import { useState } from "react";

import { createClient } from "@/lib/supabase";

/** OAuth-knoppen tonen? Zet in .env.local eventueel:
 * NEXT_PUBLIC_ENABLE_OAUTH=false   // om ze te verbergen tijdens dev
 */
const OAUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_OAUTH !== "false";

/** Helpers */
const validateEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
const validatePassword = (v: string) => v.length >= 8;
const required = (s?: string) => !!s && s.trim().length > 0;
const normalizeBEVAT = (v: string) => {
  const raw = v.replace(/[^0-9]/g, "");
  return raw ? (raw.startsWith("0") ? `BE${raw.slice(1)}` : `BE${raw}`) : "";
};
const looksLikeBEVAT = (v: string) => /^BE[0-9]{10}$/.test(v);
const looksLikeIBAN = (v: string) =>
  /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(v.replace(/\s/g, "").toUpperCase());

/** Kleine inline iconen (lichtgewicht) */
function IconGoogle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" {...props} aria-hidden>
      <path
        fill="#FFC107"
        d="M43.61 20.08H42V20H24v8h11.27c-1.64 4.66-6.08 8-11.27 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.85 1.16 7.96 3.04l5.66-5.66C34.46 6.09 29.49 4 24 4 16.04 4 9.08 8.53 6.31 14.69z"
      />
      <path
        fill="#FF3D00"
        d="M6.31 14.69l6.57 4.82C14.3 16.95 18.82 14 24 14c3.06 0 5.85 1.16 7.96 3.04l5.66-5.66C34.46 6.09 29.49 4 24 4 16.04 4 9.08 8.53 6.31 14.69z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.1 0 9.8-1.95 13.31-5.12l-6.15-5.2C29.11 35.9 26.69 36.8 24 36.8c-5.16 0-9.56-3.31-11.19-7.94l-6.5 5.02C8.02 39.38 15.5 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.61 20.08H42V20H24v8h11.27c-.77 2.19-2.21 4.07-4.14 5.39l6.15 5.2C39.51 35.94 44 30.52 44 24c0-1.34-.14-2.65-.39-3.92z"
      />
    </svg>
  );
}
function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        fill="currentColor"
        d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0022 12z"
      />
    </svg>
  );
}
function IconApple(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        fill="currentColor"
        d="M16.36 1.64a4.36 4.36 0 01-1.04 3.21 3.9 3.9 0 01-3 .1 4.36 4.36 0 011.04-3.21A3.9 3.9 0 0116.36 1.64zM19.9 17.26a9.45 9.45 0 01-1.93 3.17c-.98 1.13-2.08 2.4-3.6 2.4s-1.88-.77-3.61-.77-2.21.75-3.62.78-2.6-1.25-3.58-2.38A10.98 10.98 0 012.8 12.9c0-2.86 1.86-4.37 3.58-4.37 1.5 0 2.43.79 3.66.79 1.2 0 1.94-.8 3.66-.8 1.18 0 2.44.62 3.3 1.68a4.9 4.9 0 00-2.33 4.15 4.94 4.94 0 002.57 4.92z"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const supabase = createClient();

  // Basis
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Contact/adres
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [bus, setBus] = useState("");
  const [postal, setPostal] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("België");

  // Zakelijk
  const [isBusiness, setIsBusiness] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [vat, setVat] = useState("");
  const [website, setWebsite] = useState("");
  const [iban, setIban] = useState("");

  // Toestemmingen + UI
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function saveDraftProfile() {
    const draft = {
      isBusiness,
      name,
      email,
      phone,
      address: { street, number, bus, postal, city, country },
      company: isBusiness
        ? { companyName, vat: normalizeBEVAT(vat), website, iban }
        : undefined,
      marketingOptIn,
      agreeTerms,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("ocaso_profile_draft", JSON.stringify(draft));
    } catch {
      // Ignoring localStorage errors (e.g., quota exceeded)
    }
  }

  async function registerEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    // Validatie
    if (!required(name)) return setErr("Vul je naam in.");
    if (!validateEmail(email)) return setErr("E-mailadres is ongeldig.");
    if (!validatePassword(password))
      return setErr("Wachtwoord moet minstens 8 tekens zijn.");
    if (password !== confirm) return setErr("Wachtwoorden komen niet overeen.");
    if (!agreeTerms) return setErr("Je moet de voorwaarden accepteren.");

    if (isBusiness) {
      const v = normalizeBEVAT(vat);
      if (v && !looksLikeBEVAT(v))
        return setErr("BTW-nummer lijkt ongeldig (formaat: BE0123456789).");
      if (iban && !looksLikeIBAN(iban)) return setErr("IBAN lijkt ongeldig.");
      if (!required(companyName)) return setErr("Vul je bedrijfsnaam in.");
    }

    setLoading(true);
    try {
      // (optioneel) lokaal concept bewaren
      saveDraftProfile();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            address: { street, number, bus, postal, city, country },
            is_business: isBusiness,
            company_name: isBusiness ? companyName : "",
            vat: isBusiness ? normalizeBEVAT(vat) : "",
            website: isBusiness ? website : "",
            iban: isBusiness ? iban : "",
            marketing_opt_in: marketingOptIn,
          },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });

      if (error) throw error;

      setOk(
        "Account aangemaakt ✅ Check je mailbox om te bevestigen (of log in).",
      );
    } catch (e: unknown) {
      console.error("signup error", e);
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("Er ging iets mis.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function signInOAuth(provider: "google" | "facebook" | "apple") {
    setErr(null);
    setOk(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErr(error.message);
  }

  const OAuthBtn = (p: { onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={p.onClick}
      className="w-full rounded-xl border border-gray-300 px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
    >
      {p.children}
    </button>
  );

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Account aanmaken</h1>

      {/* OAuth (optioneel zichtbaar) */}
      {OAUTH_ENABLED && (
        <div className="mb-6 grid gap-3">
          <OAuthBtn onClick={() => signInOAuth("google")}>
            <IconGoogle />
            <span>Registreren met Google</span>
          </OAuthBtn>
          <OAuthBtn onClick={() => signInOAuth("facebook")}>
            <IconFacebook />
            <span>Registreren met Facebook</span>
          </OAuthBtn>
          <OAuthBtn onClick={() => signInOAuth("apple")}>
            <IconApple />
            <span>Registreren met Apple</span>
          </OAuthBtn>
          <div className="text-center text-sm text-gray-500">
            of met e-mail & wachtwoord
          </div>
        </div>
      )}

      <form onSubmit={registerEmailPassword} className="grid gap-6">
        {/* Account basis */}
        <section className="grid gap-3 rounded-2xl border border-gray-200 p-4">
          <h2 className="font-medium">Accountgegevens</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Naam</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input
                type="email"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Wachtwoord (min. 8 tekens)
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Bevestig wachtwoord</label>
              <input
                type="password"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>
        </section>

        {/* Contact & adres */}
        <section className="grid gap-3 rounded-2xl border border-gray-200 p-4">
          <h2 className="font-medium">Contact & adres</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Telefoon (optioneel)</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Land</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-6 gap-3">
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Straat</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Nr.</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Bus (optioneel)</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={bus}
                onChange={(e) => setBus(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Postcode</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Gemeente / Stad</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Zakelijke verkoper */}
        <section className="grid gap-3 rounded-2xl border border-gray-200 p-4">
          <h2 className="font-medium">Zakelijke verkoper</h2>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={isBusiness}
              onChange={(e) => setIsBusiness(e.target.checked)}
            />
            <span>
              Ik verkoop als <strong>zakelijke</strong> verkoper
            </span>
          </label>

          {isBusiness && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Bedrijfsnaam</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required={isBusiness}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  BTW-nummer (BE0123456789)
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={vat}
                  onChange={(e) => setVat(e.target.value.toUpperCase())}
                  placeholder="BE0XXXXXXXXX"
                />
                {vat && !looksLikeBEVAT(normalizeBEVAT(vat)) && (
                  <p className="text-xs text-red-500 mt-1">
                    Controleer het BTW-formaat.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">
                  Website (optioneel)
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">IBAN (optioneel)</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  placeholder="BE68 5390 0754 7034"
                />
                {iban && !looksLikeIBAN(iban) && (
                  <p className="text-xs text-red-500 mt-1">
                    IBAN lijkt ongeldig.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Toestemmingen */}
        <section className="grid gap-3 rounded-2xl border border-gray-200 p-4">
          <h2 className="font-medium">Toestemmingen</h2>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>
              Ik ga akkoord met de{" "}
              <Link href="/terms" className="underline">
                algemene voorwaarden
              </Link>{" "}
              en het{" "}
              <Link href="/privacy" className="underline">
                privacybeleid
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
            />
            <span>
              Ik ontvang graag updates & acties via e-mail (optioneel).
            </span>
          </label>
        </section>

        {/* Acties */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary text-black px-4 py-2 font-medium hover:opacity-90"
          >
            {loading ? "Bezig…" : "Account aanmaken"}
          </button>
          <Link href="/login" className="text-sm underline">
            Ik heb al een account
          </Link>
        </div>

        {/* ✅ Succesbericht */}
        {ok && <p className="text-green-600 text-sm">{ok}</p>}

        {/* 🔁 Altijd zichtbare 'verstuur opnieuw' zodra e-mail geldig is */}
        {validateEmail(email) && (
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.resend({
                type: "signup",
                email,
                options: {
                  emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
              });
              if (error) {
                alert(`Kon mail niet opnieuw sturen: ${error.message}`);
              } else {
                alert("Verificatiemail opnieuw verstuurd ✅");
              }
            }}
            className="text-sm underline mt-1 self-start"
          >
            Geen mail ontvangen? Verstuur opnieuw
          </button>
        )}

        {/* ❌ Foutmelding */}
        {err && <p className="text-red-500 text-sm">{err}</p>}
      </form>
    </div>
  );
}
