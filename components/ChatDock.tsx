"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { id: string; from: "me" | "them"; text: string; at: string };

export default function ChatDock({
  chatId,
  title,
  onClose,
  minimized = false,
  onMinimize,
  index = 0,
}: {
  chatId: string;
  title: string;
  onClose: () => void;
  minimized?: boolean;
  onMinimize?: (v: boolean) => void;
  index?: number;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/messages/${chatId}`, { cache: "no-store" });
    const d = await r.json();
    setMessages(d.messages || []);
  }, [chatId]);

  useEffect(() => {
    load();
  }, [chatId, load]);

  useEffect(() => {
    // autoscroll to bottom on new messages
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
    <div
      className="fixed bottom-4 right-4 z-40"
      style={{ width: "360px", transform: `translateX(-${index * 380}px)` }}
    >
      <div className="rounded-2xl shadow-lg border bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
          <div className="font-medium truncate">{title}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMinimize?.(!minimized)}
              className="text-sm text-gray-500 hover:underline"
            >
              {minimized ? "Openen" : "Minimaliseren"}
            </button>
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:underline"
            >
              Sluiten
            </button>
          </div>
        </div>

        {/* Messages */}
        {!minimized && (
          <div
            ref={boxRef}
            className="max-h-72 overflow-y-auto p-3 space-y-2 bg-white"
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
        )}

        {/* Input */}
        {!minimized && (
          <div className="flex items-center gap-2 p-3 border-t bg-white">
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
        )}
      </div>
    </div>
  );
}
