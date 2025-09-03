"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { id: string; from: "me" | "them"; text: string; at: string };

export default function ChatPage({ params }: { params: { id: string } }) {
  const chatId = params.id;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    const r = await fetch(`/api/messages/${chatId}`, { cache: "no-store" });
    const d = await r.json();
    setMessages(d.messages || []);
  };

  useEffect(() => {
    load();
  }, [chatId]);
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    const r = await fetch(`/api/messages/${chatId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t, from: "me" }),
    });
    const d = await r.json();
    setMessages((prev) => [...prev, d.message]);
  };

  return (
    <div className="container py-6 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chat {chatId}</h1>
        <a href="/profile" className="text-sm text-gray-600 hover:underline">
          Terug naar profiel
        </a>
      </div>
      <div
        ref={boxRef}
        className="card p-4 max-h-[60vh] overflow-y-auto space-y-2"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.from === "me" ? "bg-primary text-black rounded-br-sm" : "bg-gray-100 rounded-bl-sm"}`}
            >
              <div>{m.text}</div>
              <div className="text-[10px] opacity-70 mt-1">
                {new Date(m.at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card p-3 flex items-center gap-2 sticky bottom-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Schrijf een bericht…"
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2"
        />
        <button
          onClick={send}
          className="rounded-xl bg-primary text-black px-4 py-2 font-medium"
        >
          Verstuur
        </button>
      </div>
    </div>
  );
}
