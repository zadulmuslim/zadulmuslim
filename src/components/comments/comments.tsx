"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useViewer, Avatar } from "@/components/layout/viewer";
import { useDialog } from "@/components/ui/dialogs";
import { cn, toBnDigits } from "@/lib/utils";

type TargetType = "question" | "article" | "hadith" | "lecture";

interface CommentDTO {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  editedAt: string | null;
  hidden: boolean;
  author: { id: string; name: string; avatar: string | null; badge: string | null };
  mine: boolean;
}
interface Thread { comments: CommentDTO[]; total: number; viewer: { id: string; canModerate: boolean } | null }

type Post = (payload: Record<string, unknown>, optimistic?: (t: Thread) => Thread) => Promise<boolean>;
type Sort = "relevant" | "newest" | "oldest";
const PAGE = 10;

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "এইমাত্র";
  const m = s / 60, h = m / 60, d = h / 24;
  if (m < 60) return `${toBnDigits(Math.floor(m))} মি.`;
  if (h < 24) return `${toBnDigits(Math.floor(h))} ঘ.`;
  if (d < 7) return `${toBnDigits(Math.floor(d))} দিন`;
  if (d < 52 * 7) return `${toBnDigits(Math.floor(d / 7))} সপ্তাহ`;
  return `${toBnDigits(Math.floor(d / 365))} বছর`;
}

/** Plain text with clickable links and @mentions in bold. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+|@[^\s@]{2,40}(?:\s[^\s@]{2,20})?(?=\s|$))/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="nofollow noopener noreferrer ugc" className="break-all text-primary underline">{p}</a>
        ) : p.startsWith("@") && i % 2 === 1 ? (
          <span key={i} className="font-semibold text-primary">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function PersonAvatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.trim().charAt(0) || "?"}
    </span>
  );
}

export function Comments({ type, id, title = "মন্তব্য" }: { type: TargetType; id: string | number; title?: string }) {
  const targetId = String(id);
  const viewer = useViewer();
  const dialog = useDialog();
  const pathname = usePathname();
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("relevant");
  const [shown, setShown] = useState(PAGE);
  const [replyTo, setReplyTo] = useState<{ rootId: string; mention: string; key: number } | null>(null);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?type=${type}&id=${encodeURIComponent(targetId)}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      setThread(await res.json());
      setError(null);
    } catch {
      setError("মন্তব্য লোড করা যায়নি।");
    }
  }, [type, targetId]);

  // Load once the reader scrolls near the section (keeps pages light).
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || loaded.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !loaded.current) {
        loaded.current = true;
        void load();
        io.disconnect();
      }
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  // Refresh once sign-in state is known (to get "mine").
  useEffect(() => {
    if (loaded.current && viewer.status !== "loading") void load();
  }, [viewer.status, load]);

  /** Applies the change locally first, then confirms with the server (reverts on failure). */
  const post: Post = useCallback(async (payload, optimistic) => {
    let before: Thread | null = null;
    if (optimistic) setThread((t) => { before = t; return t ? optimistic(t) : t; });
    try {
      const res = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "আবার চেষ্টা করুন।");
      if (data.comment) setThread((t) => (t ? { ...t, comments: [...t.comments, data.comment], total: t.total + 1 } : t));
      else if (data.message) void dialog.alert({ title: "ধন্যবাদ", message: data.message });
      return true;
    } catch (e) {
      if (optimistic && before) setThread(before);
      await dialog.alert({ title: "সম্ভব হয়নি", message: e instanceof Error ? e.message : "আবার চেষ্টা করুন।" });
      return false;
    }
  }, [dialog]);

  const { roots, replies } = useMemo(() => {
    const list = thread?.comments ?? [];
    const replies = new Map<string, CommentDTO[]>();
    const roots: CommentDTO[] = [];
    for (const c of list) {
      if (c.parentId) replies.set(c.parentId, [...(replies.get(c.parentId) ?? []), c]);
      else roots.push(c);
    }
    const score = (c: CommentDTO) => (replies.get(c.id)?.length ?? 0) * 3 + new Date(c.createdAt).getTime() / 3.6e9;
    roots.sort((a, b) =>
      sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : score(b) - score(a),
    );
    return { roots, replies };
  }, [thread, sort]);

  const signedIn = viewer.status === "signed-in";
  const total = thread?.total ?? 0;

  return (
    <section ref={sectionRef} id="comments" className="mt-10 scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">
          {title} {thread && <span className="text-muted-foreground">({toBnDigits(total)})</span>}
        </h2>
        {roots.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="sr-only">সাজান</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="relevant">প্রাসঙ্গিক আগে</option>
              <option value="newest">নতুন আগে</option>
              <option value="oldest">পুরনো আগে</option>
            </select>
          </label>
        )}
      </div>

      {signedIn ? (
        <Composer
          avatar={<Avatar viewer={viewer} size={36} />}
          placeholder="আপনার মন্তব্য লিখুন…"
          onSubmit={(body) => post({ action: "create", type, id: targetId, body })}
        />
      ) : viewer.status === "anonymous" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/5 px-4 py-3 text-sm">
          <span className="text-foreground">মন্তব্য করতে লগইন করুন।</span>
          <div className="flex gap-2">
            <Link href={`/login?next=${encodeURIComponent(pathname + "#comments")}`} className="rounded-lg bg-primary px-3 py-1.5 font-medium text-white hover:bg-brand-deep">লগইন</Link>
            <Link href={`/signup?next=${encodeURIComponent(pathname + "#comments")}`} className="rounded-lg border border-primary/30 px-3 py-1.5 font-medium text-primary hover:bg-primary/5">নিবন্ধন</Link>
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">শালীন ও প্রাসঙ্গিক মন্তব্য করুন। শরঈ প্রশ্ন থাকলে <Link href="/ask" className="text-primary underline">আলেমদের কাছে প্রশ্ন করুন</Link>।</p>

      <div className="mt-5 space-y-5">
        {!thread && !error && <Skeleton />}
        {error && (
          <p className="text-sm text-muted-foreground">
            {error} <button onClick={() => void load()} className="text-primary underline">আবার চেষ্টা করুন</button>
          </p>
        )}
        {thread && roots.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন।</p>}

        {roots.slice(0, shown).map((c) => (
          <div key={c.id}>
            <CommentItem
              c={c}
              thread={thread!}
              signedIn={signedIn}
              post={post}
              onReply={() => setReplyTo({ rootId: c.id, mention: "", key: Date.now() })}
            />
            <Replies
              list={replies.get(c.id) ?? []}
              thread={thread!}
              signedIn={signedIn}
              post={post}
              onReply={(name) => setReplyTo({ rootId: c.id, mention: name, key: Date.now() })}
              forceOpen={replyTo?.rootId === c.id}
            />
            {signedIn && replyTo?.rootId === c.id && (
              <div className="ml-11 mt-2 sm:ml-12">
                <Composer
                  key={replyTo.key}
                  autoFocus
                  small
                  initial={replyTo.mention ? `@${replyTo.mention} ` : ""}
                  avatar={<Avatar viewer={viewer} size={28} />}
                  placeholder={`${c.author.name}-কে উত্তর দিন…`}
                  onCancel={() => setReplyTo(null)}
                  onSubmit={async (body) => {
                    const ok = await post({ action: "create", type, id: targetId, parentId: c.id, body });
                    if (ok) setReplyTo(null);
                    return ok;
                  }}
                />
              </div>
            )}
          </div>
        ))}

        {roots.length > shown && (
          <button onClick={() => setShown((n) => n + PAGE)} className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline">
            আরও মন্তব্য দেখুন ({toBnDigits(roots.length - shown)})
          </button>
        )}
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="size-9 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-muted/70" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Composer({
  avatar, placeholder, onSubmit, onCancel, initial = "", autoFocus, small,
}: {
  avatar: React.ReactNode; placeholder: string; onSubmit: (body: string) => Promise<boolean>; onCancel?: () => void;
  initial?: string; autoFocus?: boolean; small?: boolean;
}) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [text]);
  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
      ref.current.setSelectionRange(ref.current.value.length, ref.current.value.length);
    }
  }, [autoFocus]);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const ok = await onSubmit(text);
    setBusy(false);
    if (ok) setText("");
  };

  return (
    <div className="flex items-start gap-2">
      {avatar}
      <div className={cn("flex-1 rounded-2xl bg-muted ring-1 ring-border transition focus-within:ring-2 focus-within:ring-primary/40", small ? "px-3 py-1.5" : "px-4 py-2")}>
        <textarea
          ref={ref}
          rows={1}
          value={text}
          maxLength={3000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void submit(); }
            if (e.key === "Escape" && onCancel) onCancel();
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="block w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {(text.trim() || onCancel) && (
          <div className="mt-1 flex items-center justify-end gap-2">
            {text.length > 2500 && <span className="mr-auto text-xs text-muted-foreground">{toBnDigits(3000 - text.length)} অক্ষর বাকি</span>}
            {onCancel && <button type="button" onClick={onCancel} className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60">বাতিল</button>}
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!text.trim() || busy}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-deep disabled:opacity-40"
              title="Ctrl+Enter"
            >
              {busy ? <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : (
                <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden><path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z" /></svg>
              )}
              পাঠান
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Replies({
  list, thread, signedIn, post, onReply, forceOpen,
}: {
  list: CommentDTO[]; thread: Thread; signedIn: boolean; post: Post;
  onReply: (name: string) => void; forceOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!list.length) return null;
  const visible = open || forceOpen ? list : [];
  return (
    <div className="ml-11 mt-2 space-y-3 border-l-2 border-border/70 pl-3 sm:ml-12">
      {visible.map((r) => (
        <CommentItem key={r.id} c={r} thread={thread} signedIn={signedIn} post={post} small onReply={() => onReply(r.author.name)} />
      ))}
      {!(open || forceOpen) && (
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v5" /></svg>
          {list.length === 1 ? `${list[0]!.author.name} উত্তর দিয়েছেন` : `আরও ${toBnDigits(list.length)}টি উত্তর দেখুন`}
        </button>
      )}
    </div>
  );
}

function CommentItem({
  c, thread, signedIn, post, onReply, small,
}: {
  c: CommentDTO; thread: Thread; signedIn: boolean; post: Post; onReply: () => void; small?: boolean;
}) {
  const dialog = useDialog();
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const canModerate = Boolean(thread.viewer?.canModerate);
  const long = c.body.length > 420 && !expanded;

  // Local edits so the UI responds instantly.
  const without = (t: Thread): Thread => {
    const gone = new Set([c.id, ...t.comments.filter((x) => x.parentId === c.id).map((x) => x.id)]);
    const comments = t.comments.filter((x) => !gone.has(x.id));
    return { ...t, comments, total: comments.length };
  };
  const patch = (fields: Partial<CommentDTO>) => (t: Thread): Thread => ({ ...t, comments: t.comments.map((x) => (x.id === c.id ? { ...x, ...fields } : x)) });

  const remove = async () => {
    if (await dialog.confirm({ title: "মন্তব্য মুছবেন?", message: "মন্তব্য ও এর সব উত্তর স্থায়ীভাবে মুছে যাবে।", tone: "danger", confirmText: "মুছে ফেলুন" })) {
      await post({ action: "delete", commentId: c.id }, without);
    }
  };
  const report = async () => {
    if (!signedIn) {
      if (await dialog.confirm({ title: "লগইন প্রয়োজন", message: "মন্তব্য রিপোর্ট করতে লগইন করুন।", confirmText: "লগইন করুন" })) {
        window.location.href = `/login?next=${encodeURIComponent(pathname + "#comments")}`;
      }
      return;
    }
    const reason = await dialog.prompt({ title: "মন্তব্য রিপোর্ট করুন", label: "কারণ (ঐচ্ছিক)", placeholder: "যেমন: অশালীন, বিভ্রান্তিকর, স্প্যাম…", confirmText: "রিপোর্ট পাঠান" });
    if (reason !== null) await post({ action: "report", commentId: c.id, reason: reason.slice(0, 300) || undefined });
  };

  const menu = [
    ...(c.mine ? [{ label: "সম্পাদনা করুন", onClick: () => setEditing(true) }] : []),
    ...(!c.mine ? [{ label: "রিপোর্ট করুন", onClick: report }] : []),
    ...(canModerate ? [{ label: c.hidden ? "আবার দেখান" : "লুকিয়ে রাখুন", onClick: () => void post({ action: "moderate", commentId: c.id, status: c.hidden ? "visible" : "hidden" }, patch({ hidden: !c.hidden })) }] : []),
    ...(c.mine || canModerate ? [{ label: "মুছে ফেলুন", onClick: remove, danger: true }] : []),
  ];

  return (
    <article className={cn("flex gap-2", c.hidden && "opacity-60")}>
      <PersonAvatar name={c.author.name} url={c.author.avatar} size={small ? 28 : 36} />
      <div className="min-w-0 flex-1">
        {editing ? (
          <Composer
            avatar={null}
            autoFocus
            small
            initial={c.body}
            placeholder="মন্তব্য সম্পাদনা করুন"
            onCancel={() => setEditing(false)}
            onSubmit={async (body) => {
              setEditing(false);
              return post({ action: "edit", commentId: c.id, body }, patch({ body: body.trim(), editedAt: new Date().toISOString() }));
            }}
          />
        ) : (
          <>
            <div className="w-fit max-w-full rounded-2xl bg-muted px-3.5 py-2">
              <div className="flex flex-wrap items-center gap-x-1.5 text-[13px] font-semibold text-foreground">
                {c.author.name}
                {c.author.badge && <span className="rounded bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">{c.author.badge}</span>}
                {c.hidden && <span className="rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800">লুকানো</span>}
              </div>
              <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground">
                <RichText text={long ? c.body.slice(0, 380) + "…" : c.body} />
                {long && <button onClick={() => setExpanded(true)} className="ml-1 font-semibold text-muted-foreground hover:underline">আরও দেখুন</button>}
              </p>
            </div>
            <div className="mt-0.5 flex items-center gap-3 pl-2 text-xs font-semibold text-muted-foreground">
              <time dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString("bn-BD")} className="font-normal">{timeAgo(c.createdAt)}</time>
              {signedIn && <button onClick={onReply} className="hover:text-foreground hover:underline">উত্তর দিন</button>}
              {c.editedAt && <span className="font-normal">সম্পাদিত</span>}
              <Menu items={menu} />
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function Menu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  if (!items.length) return null;
  return (
    <div ref={ref} className="relative ml-auto shrink-0">
      <button
        type="button"
        aria-label="আরও অপশন"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-7 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground aria-expanded:bg-muted"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl bg-card py-1 shadow-lg ring-1 ring-border">
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              onClick={() => { setOpen(false); it.onClick(); }}
              className={cn("block w-full px-3 py-2 text-left text-sm hover:bg-muted", it.danger ? "text-rose-600" : "text-foreground")}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
