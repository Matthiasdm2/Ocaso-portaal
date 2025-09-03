"use client";

import Link from "next/link";
import { useState } from "react";

import { createClient } from "@/lib/supabase";

const OAUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_OAUTH !== "false";

/** Kleine inline iconen */
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

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("invalid"))
          throw new Error("Combinatie e-mail/wachtwoord klopt niet.");
        if (msg.includes("email") && msg.includes("confirm")) {
          setInfo(
            "E-mail nog niet bevestigd. Check je mailbox of kies “Wachtwoord vergeten”.",
          );
          throw new Error("Bevestiging vereist.");
        }
        throw error;
      }
      window.location.href = "/profile";
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message ?? "Inloggen mislukt.");
      } else {
        setErr("Inloggen mislukt.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function signInOAuth(provider: "google" | "facebook" | "apple") {
    setErr(null);
    setInfo(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErr(error.message);
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const target = resetEmail || email;
      if (!target) throw new Error("Vul je e-mailadres in.");
      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      setInfo("Reset-mail verstuurd! Check je mailbox.");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message ?? "Kon reset-mail niet versturen.");
      } else {
        setErr("Kon reset-mail niet versturen.");
      }
    } finally {
      setLoading(false);
    }
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
    <div className="container py-10 flex justify-center">
      <div className="card p-6 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Inloggen</h1>

        {OAUTH_ENABLED && (
          <div className="grid gap-2">
            <OAuthBtn onClick={() => signInOAuth("google")}>
              <IconGoogle />
              <span>Inloggen met Google</span>
            </OAuthBtn>
            <OAuthBtn onClick={() => signInOAuth("facebook")}>
              <IconFacebook />
              <span>Inloggen met Facebook</span>
            </OAuthBtn>
            <OAuthBtn onClick={() => signInOAuth("apple")}>
              <IconApple />
              <span>Inloggen met Apple</span>
            </OAuthBtn>
            <div className="text-center text-xs text-gray-500">
              of met e-mail & wachtwoord
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2"
            required
          />
          <button
            className="w-full rounded-xl bg-primary text-black px-4 py-2 font-medium disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Bezig…" : "Inloggen"}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <button className="underline" onClick={() => setShowReset((v) => !v)}>
            Wachtwoord vergeten?
          </button>
          <Link href="/register" className="underline">
            Account aanmaken
          </Link>
        </div>

        {showReset && (
          <form onSubmit={sendReset} className="space-y-2 border-t pt-3">
            <p className="text-sm">We sturen je een reset-link per e-mail.</p>
            <input
              type="email"
              placeholder="E-mail (indien anders)"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            />
            <button
              className="w-full rounded-xl border px-4 py-2 font-medium disabled:opacity-60"
              disabled={loading}
            >
              Verstuur reset-mail
            </button>
          </form>
        )}

        {info && <p className="text-green-600 text-sm">{info}</p>}
        {err && <p className="text-red-500 text-sm">{err}</p>}
      </div>
    </div>
  );
}
