export const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function api<T>(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
