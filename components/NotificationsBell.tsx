"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/format";

type Notification = {
  id: number;
  athleteId: number;
  athleteName: string;
  opponent: string;
  statLabel: string;
  value: number;
  read: boolean;
  createdAt: string;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  function load() {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) load();
      return next;
    });
  }

  async function markOneRead(id: number) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", { method: "PATCH" });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Avisos"
        className="relative bg-transparent border-none cursor-pointer text-muted-1 hover:text-white p-1"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 px-1 flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-95 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,.25)] overflow-hidden z-50 text-left">
          <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
            <div className="font-heading font-bold text-lg uppercase text-ink">Avisos</div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="bg-transparent border-none text-xs font-semibold text-brand-red cursor-pointer hover:underline"
              >
                Marcar todos como lidos
              </button>
            )}
          </div>

          <div className="max-h-100 overflow-y-auto">
            {loading ? (
              <p className="text-muted-2 text-sm px-5 py-6 text-center">Carregando…</p>
            ) : notifications.length === 0 ? (
              <p className="text-muted-2 text-sm px-5 py-6 text-center">
                Nenhum recorde pessoal registrado ainda.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && markOneRead(n.id)}
                  className="w-full text-left px-5 py-3.5 border-b border-border-light last:border-0 flex gap-2.5 items-start bg-transparent border-none cursor-pointer hover:bg-bg-subtle"
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-brand-red"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${n.read ? "text-muted-1" : "font-semibold text-ink"}`}>
                      <Link
                        href={`/perfil/${n.athleteId}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {n.athleteName}
                      </Link>{" "}
                      bateu novo recorde pessoal!
                    </div>
                    <div className="text-xs text-muted-2 mt-0.5">
                      {n.statLabel}: <span className="font-bold text-brand-red">{n.value}</span> · vs{" "}
                      {n.opponent}
                    </div>
                    <div className="text-[11px] text-muted-3 mt-1">{timeAgo(n.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
