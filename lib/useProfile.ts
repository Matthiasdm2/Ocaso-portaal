
"use client";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabaseClient";

export type ProfileLite = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  business?: { isBusiness: boolean };
};

export function useProfile() {
  const supabase = createClient();
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (typeof window !== "undefined") window.location.href = "/login"; return; }

      const { data } = await supabase.from("profiles").select(`
        id, full_name, avatar_url, is_business
      `).eq("id", user.id).maybeSingle();

      if (data) {
        const parts = (data.full_name || "").trim().split(" ");
        setProfile({
          id: data.id,
          firstName: parts.slice(0, -1).join(" ") || parts[0] || "",
          lastName: parts.length > 1 ? parts.slice(-1).join(" ") : "",
          avatarUrl: data.avatar_url || "",
          business: { isBusiness: !!data.is_business },
        });
      }
      setLoading(false);
    })();
  }, [supabase]);

  return { profile, loading, setProfile };
}
