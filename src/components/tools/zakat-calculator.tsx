"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { printSection } from "@/lib/print-section";
import { Coins, Gem, HandCoins, Info, Landmark, Printer, RotateCcw, Store, Wallet } from "lucide-react";
import { cn, toBnDigits } from "@/lib/utils";

/**
 * Zakat calculator (Hanafi). Nisab: 52.5 ভরি (612.36 g) silver, or 7.5 ভরি
 * (87.48 g) gold when gold is the only zakatable wealth. Rate 2.5%.
 * Inputs stay in this browser only.
 */
const STORE = "zm-zakat-v1";
const GRAM_PER_VORI = 11.664;
const SILVER_NISAB_VORI = 52.5;
const GOLD_NISAB_VORI = 7.5;

type Unit = "vori" | "gram";
interface State {
  cash: string; bank: string; mobile: string; saving: string;
  goldWeight: string; goldUnit: Unit; goldPrice: string;
  silverWeight: string; silverUnit: Unit; silverPrice: string;
  goods: string; receivable: string; investment: string; other: string;
  debts: string; dueBills: string;
}
const EMPTY: State = {
  cash: "", bank: "", mobile: "", saving: "",
  goldWeight: "", goldUnit: "vori", goldPrice: "",
  silverWeight: "", silverUnit: "vori", silverPrice: "",
  goods: "", receivable: "", investment: "", other: "",
  debts: "", dueBills: "",
};

/** Accepts Bengali or English digits and commas. */
const num = (s: string) => {
  const n = Number(s.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6)).replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const toVori = (w: string, u: Unit) => (u === "vori" ? num(w) : num(w) / GRAM_PER_VORI);
const taka = (n: number) => `৳ ${toBnDigits(Math.round(n).toLocaleString("en-IN"))}`;
const fixed = (n: number, d = 2) => toBnDigits(n.toFixed(d).replace(/\.?0+$/, ""));

function Field({ label, hint, value, onChange, suffix }: { label: string; hint?: string; value: string; onChange: (v: string) => void; suffix?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      <span className="mt-1 flex items-center rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="০"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums focus:outline-none"
        />
        {suffix ?? <span className="pr-3 text-sm text-muted-foreground">টাকা</span>}
      </span>
    </label>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border bg-card p-5 shadow-sm">
      <legend className="sr-only">{title}</legend>
      <p className="mb-4 flex items-center gap-2 font-bold text-primary" aria-hidden>
        <Icon className="size-5 text-accent" /> {title}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function ZakatCalculator() {
  const resultRef = useRef<HTMLDivElement>(null);
  const [s, setS] = useState<State>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const set = (k: keyof State) => (v: string) => setS((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) setS({ ...EMPTY, ...JSON.parse(saved) });
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(s));
    } catch {}
  }, [s, loaded]);

  const r = useMemo(() => {
    const goldVori = toVori(s.goldWeight, s.goldUnit);
    const silverVori = toVori(s.silverWeight, s.silverUnit);
    const goldValue = goldVori * num(s.goldPrice);
    const silverValue = silverVori * num(s.silverPrice);
    const cash = num(s.cash) + num(s.bank) + num(s.mobile) + num(s.saving);
    const other = num(s.goods) + num(s.receivable) + num(s.investment) + num(s.other);
    const assets = cash + goldValue + silverValue + other;
    const liabilities = num(s.debts) + num(s.dueBills);
    const net = Math.max(0, assets - liabilities);
    const onlyGold = goldVori > 0 && cash + silverValue + other === 0;
    const silverNisabValue = SILVER_NISAB_VORI * num(s.silverPrice);

    let due: boolean | null;
    let basis: string;
    if (onlyGold) {
      due = goldVori >= GOLD_NISAB_VORI && net > 0;
      basis = `শুধু স্বর্ণ থাকায় নিসাব ${fixed(GOLD_NISAB_VORI)} ভরি স্বর্ণ; আপনার আছে ${fixed(goldVori)} ভরি।`;
    } else if (num(s.silverPrice) > 0) {
      due = net >= silverNisabValue && net > 0;
      basis = `নিসাব = ${fixed(SILVER_NISAB_VORI)} ভরি রূপার মূল্য = ${taka(silverNisabValue)}।`;
    } else {
      due = null;
      basis = "নিসাব নির্ণয়ের জন্য রূপার বর্তমান দাম (প্রতি ভরি) লিখুন।";
    }
    return { goldVori, silverVori, goldValue, silverValue, cash, other, assets, liabilities, net, due, basis, zakat: due ? net * 0.025 : 0 };
  }, [s]);

  const weight = (k: "goldWeight" | "silverWeight", u: "goldUnit" | "silverUnit") => (
    <Field
      label="ওজন"
      value={s[k]}
      onChange={set(k)}
      suffix={
        <select value={s[u]} onChange={(e) => set(u)(e.target.value)} className="mr-1 h-9 rounded-md bg-secondary px-2 text-sm" aria-label="এককের ধরন">
          <option value="vori">ভরি</option>
          <option value="gram">গ্রাম</option>
        </select>
      }
    />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <Section icon={Wallet} title="নগদ অর্থ ও ব্যাংক">
          <Field label="হাতে নগদ টাকা" value={s.cash} onChange={set("cash")} />
          <Field label="ব্যাংক হিসাবের জমা" value={s.bank} onChange={set("bank")} />
          <Field label="মোবাইল ব্যাংকিং (বিকাশ, নগদ ইত্যাদি)" value={s.mobile} onChange={set("mobile")} />
          <Field label="সঞ্চয়পত্র, ডিপিএস, এফডিআর" hint="মূল জমা অংশ" value={s.saving} onChange={set("saving")} />
        </Section>

        <Section icon={Gem} title="স্বর্ণ">
          {weight("goldWeight", "goldUnit")}
          <Field label="প্রতি ভরির বর্তমান বিক্রয়মূল্য" hint="আপনার স্বর্ণের ক্যারেট অনুযায়ী" value={s.goldPrice} onChange={set("goldPrice")} />
        </Section>

        <Section icon={Coins} title="রূপা">
          {weight("silverWeight", "silverUnit")}
          <Field label="প্রতি ভরির বর্তমান দাম" hint="নিসাব হিসাবের জন্য অবশ্যই লিখুন" value={s.silverPrice} onChange={set("silverPrice")} />
        </Section>

        <Section icon={Store} title="ব্যবসা, পাওনা ও বিনিয়োগ">
          <Field label="ব্যবসার পণ্যের বর্তমান মূল্য" hint="বিক্রয়ের উদ্দেশ্যে রাখা পণ্য" value={s.goods} onChange={set("goods")} />
          <Field label="ফেরত পাওয়ার আশা আছে এমন পাওনা" value={s.receivable} onChange={set("receivable")} />
          <Field label="শেয়ার ও বিনিয়োগের বাজারমূল্য" value={s.investment} onChange={set("investment")} />
          <Field label="অন্যান্য যাকাতযোগ্য সম্পদ" value={s.other} onChange={set("other")} />
        </Section>

        <Section icon={Landmark} title="বাদ যাবে (দেনা)">
          <Field label="বর্তমানে পরিশোধযোগ্য ঋণ" hint="এখনই বা এ বছর দিতে হবে এমন" value={s.debts} onChange={set("debts")} />
          <Field label="বকেয়া বিল, বেতন ও ভাড়া" value={s.dueBills} onChange={set("dueBills")} />
        </Section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div ref={resultRef} className="overflow-hidden rounded-2xl border bg-card shadow-md">
          <div className="bg-gradient-to-br from-brand-deep to-primary p-5 text-white">
            <p className="flex items-center gap-2 text-sm text-white/80"><HandCoins className="size-4 text-accent" /> আপনার যাকাত</p>
            <p className="mt-1 text-4xl font-bold tabular-nums">{taka(r.zakat)}</p>
            <p className={cn("mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold", r.due ? "bg-accent text-brand-deep" : "bg-white/15")}>
              {r.due === null ? "নিসাব নির্ণয় বাকি" : r.due ? "যাকাত ফরয (নিসাব পূর্ণ)" : "নিসাব পূর্ণ হয়নি — যাকাত ফরয নয়"}
            </p>
          </div>
          <dl className="divide-y text-sm">
            {[
              ["নগদ ও ব্যাংক", r.cash],
              [`স্বর্ণ (${fixed(r.goldVori)} ভরি)`, r.goldValue],
              [`রূপা (${fixed(r.silverVori)} ভরি)`, r.silverValue],
              ["ব্যবসা, পাওনা ও বিনিয়োগ", r.other],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between gap-3 px-5 py-2.5"><dt className="text-muted-foreground">{l}</dt><dd className="tabular-nums">{taka(v as number)}</dd></div>
            ))}
            <div className="flex justify-between gap-3 px-5 py-2.5"><dt className="text-muted-foreground">মোট সম্পদ</dt><dd className="font-semibold tabular-nums">{taka(r.assets)}</dd></div>
            <div className="flex justify-between gap-3 px-5 py-2.5"><dt className="text-muted-foreground">বাদ: দেনা</dt><dd className="tabular-nums text-destructive">− {taka(r.liabilities)}</dd></div>
            <div className="flex justify-between gap-3 bg-secondary/40 px-5 py-3"><dt className="font-semibold">যাকাতযোগ্য নিট সম্পদ</dt><dd className="font-bold tabular-nums text-primary">{taka(r.net)}</dd></div>
          </dl>
          <p className="flex gap-2 border-t px-5 py-3 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" />{r.basis} হার: নিট সম্পদের ২.৫%।</p>
          <div className="flex gap-2 border-t p-4 print:hidden">
            <button type="button" onClick={() => printSection(resultRef.current, "যাকাতের হিসাব")} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border text-sm font-semibold hover:border-accent"><Printer className="size-4" /> প্রিন্ট / PDF</button>
            <button type="button" onClick={() => setS(EMPTY)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border text-sm font-semibold hover:border-destructive hover:text-destructive"><RotateCcw className="size-4" /> নতুন করে</button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">আপনার দেওয়া তথ্য শুধু এই ব্রাউজারেই থাকে, কোথাও পাঠানো হয় না।</p>
      </aside>
    </div>
  );
}
