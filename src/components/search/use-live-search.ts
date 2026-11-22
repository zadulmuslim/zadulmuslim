"use client";
import { useEffect, useRef, useState } from "react";

export interface Hit { title: string; href: string; snippet?: string; meta?: string }
export interface Group { type: string; label: string; count: number; hits: Hit[] }
export interface Shortcut { title: string; href: string; hint: string }
export interface SearchResult { q: string; shortcuts: Shortcut[]; groups: Group[]; total: number }

const cache = new Map<string, SearchResult>();

/** Debounced, abortable fetch of /api/search with a small in-memory cache. */
export function useLiveSearch(q: string, opts: { types?: string[]; limit?: number; delay?: number } = {}) {
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const key = `${q.trim()}|${(opts.types ?? []).join(",")}|${opts.limit ?? 4}`;

  useEffect(() => {
    const term = q.trim();
    ctrl.current?.abort();
    if (term.length < 1) {
      setData(null);
      setLoading(false);
      return;
    }
    const hit = cache.get(key);
    if (hit) {
      setData(hit);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const c = new AbortController();
      ctrl.current = c;
      try {
        const params = new URLSearchParams({ q: term, limit: String(opts.limit ?? 4) });
        if (opts.types?.length) params.set("type", opts.types.join(","));
        const res = await fetch(`/api/search?${params}`, { signal: c.signal });
        const json = (await res.json()) as SearchResult;
        cache.set(key, json);
        if (cache.size > 60) cache.delete(cache.keys().next().value!);
        setData(json);
        setError(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true);
      } finally {
        if (!c.signal.aborted) setLoading(false);
      }
    }, opts.delay ?? 220);
    return () => clearTimeout(t);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}

/* Recent searches (this browser only) */
const RECENT = "zm-recent-searches";
export function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT) ?? "[]").slice(0, 6);
  } catch {
    return [];
  }
}
export function addRecent(q: string) {
  const term = q.trim();
  if (term.length < 2) return;
  try {
    localStorage.setItem(RECENT, JSON.stringify([term, ...getRecent().filter((x) => x !== term)].slice(0, 6)));
  } catch {}
}
export function clearRecent() {
  try {
    localStorage.removeItem(RECENT);
  } catch {}
}
