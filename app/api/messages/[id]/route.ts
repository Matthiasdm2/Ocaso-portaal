import { NextResponse } from "next/server";

type Msg = { id: string; from: "me" | "them"; text: string; at: string };

const STORE: Record<string, Msg[]> = {};

function seed(id: string) {
  if (STORE[id]) return;
  const base = Date.now() - 1000 * 60 * 30;
  STORE[id] = [
    {
      id: "m1",
      from: "them",
      text: "Hallo! Is dit nog beschikbaar?",
      at: new Date(base).toISOString(),
    },
    {
      id: "m2",
      from: "me",
      text: "Ja, zeker. In goede staat.",
      at: new Date(base + 1000 * 60 * 2).toISOString(),
    },
    {
      id: "m3",
      from: "them",
      text: "Kan het afgehaald worden in Gent?",
      at: new Date(base + 1000 * 60 * 5).toISOString(),
    },
  ];
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  seed(params.id);
  return NextResponse.json({ messages: STORE[params.id] || [] });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  seed(params.id);
  const body = await request.json();
  const msg: Msg = {
    id: "m" + (STORE[params.id].length + 1),
    from: body.from === "them" ? "them" : "me",
    text: String(body.text || "").slice(0, 2000),
    at: new Date().toISOString(),
  };
  STORE[params.id].push(msg);
  return NextResponse.json({ ok: true, message: msg });
}
