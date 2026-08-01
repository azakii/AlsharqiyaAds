"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, ChevronRight, ChevronLeft, ChevronDown, X, RotateCcw } from "lucide-react";
import InfluencerCard from "./InfluencerCard";
import { CITIES, CATEGORIES } from "@/lib/constants";
import type { Influencer } from "@/lib/types";

const PAGE_SIZE = 12;

const FOLLOWER_RANGES = [
  { label: "+1K متابع", min: 1_000 },
  { label: "+10K متابع", min: 10_000 },
  { label: "+50K متابع", min: 50_000 },
  { label: "+100K متابع", min: 100_000 },
  { label: "+500K متابع", min: 500_000 },
];

export default function InfluencerExplorer({ influencers }: { influencers: Influencer[] }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [followersLabel, setFollowersLabel] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const minFollowers = FOLLOWER_RANGES.find((r) => r.label === followersLabel)?.min ?? 0;

  const filtered = useMemo(() => {
    return influencers.filter((i) => {
      const matchQ =
        !q ||
        i.name.includes(q) ||
        i.city.includes(q) ||
        i.category.includes(q);
      const matchCity = !city || i.city === city;
      const matchCat = !category || i.category === category;
      const matchFollowers = i.followers >= minFollowers;
      return matchQ && matchCity && matchCat && matchFollowers;
    });
  }, [influencers, q, city, category, minFollowers]);

  useEffect(() => {
    setPage(1);
  }, [q, city, category, followersLabel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const paged = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  const activeFilters = (city ? 1 : 0) + (category ? 1 : 0) + (followersLabel ? 1 : 0);

  function resetFilters() {
    setCity("");
    setCategory("");
    setFollowersLabel("");
  }

  return (
    <section id="celebrities" className="container-max scroll-mt-24 py-20">
      <div className="text-center">
        <span className="badge-gold mx-auto">نخبة المؤثرين الموثّقين</span>
        <h2 className="mt-4 font-display text-4xl font-bold gold-text">استكشف المؤثرين</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          ابحث وصفِّ النتائج حسب المدينة، التصنيف، وعدد المتابعين
        </p>
      </div>

      {/* unified search pill */}
      <div className="relative z-30 mx-auto mt-8 max-w-4xl">
        <div className="glass flex items-center gap-2 rounded-2xl p-2 shadow-2xl">
          <div className="flex flex-1 items-center gap-3 px-4">
            <Search className="h-5 w-5 flex-shrink-0 text-gold" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن مؤثر بالاسم أو المدينة أو التصنيف..."
              aria-label="بحث عن مؤثر"
              className="flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-muted"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                aria-label="مسح البحث"
                className="flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`relative flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              showFilters ? "bg-gold/15 text-gold" : activeFilters ? "text-gold hover:bg-white/5" : "text-muted hover:bg-white/5 hover:text-gold"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> فلترة
            {activeFilters > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-bold text-bg">
                {activeFilters}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="glass animate-dropdown mt-3 rounded-2xl p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <SearchableSelect
                label="المدينة"
                value={city}
                onChange={setCity}
                options={CITIES}
                placeholder="كل المدن"
                searchable
              />
              <SearchableSelect
                label="التصنيف"
                value={category}
                onChange={setCategory}
                options={CATEGORIES}
                placeholder="كل التصنيفات"
              />
              <SearchableSelect
                label="عدد المتابعين"
                value={followersLabel}
                onChange={setFollowersLabel}
                options={FOLLOWER_RANGES.map((r) => r.label)}
                placeholder="أي عدد متابعين"
              />
            </div>

            {activeFilters > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                {city && <FilterChip label={`المدينة: ${city}`} onRemove={() => setCity("")} />}
                {category && <FilterChip label={`التصنيف: ${category}`} onRemove={() => setCategory("")} />}
                {followersLabel && <FilterChip label={followersLabel} onRemove={() => setFollowersLabel("")} />}
                <button
                  onClick={resetFilters}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted transition-colors hover:text-gold"
                >
                  <RotateCcw className="h-3 w-3" /> مسح الكل
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        عرض <span className="text-gold">{filtered.length}</span> مؤثر
      </p>

      {filtered.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-muted">لا توجد نتائج مطابقة للبحث.</p>
          {(q || activeFilters > 0) && (
            <button
              onClick={() => {
                setQ("");
                resetFilters();
              }}
              className="btn-outline mx-auto mt-4 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> مسح البحث والفلاتر
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {paged.map((inf) => (
              <InfluencerCard key={inf.id} inf={inf} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageClamped <= 1}
                className="glass flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/70 transition hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="الصفحة السابقة"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted">
                صفحة <span className="font-semibold text-white">{pageClamped}</span> من{" "}
                <span className="font-semibold text-white">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageClamped >= totalPages}
                className="glass flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/70 transition hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="الصفحة التالية"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="chip cursor-default gap-1.5 !bg-gold/10 !text-gold">
      {label}
      <button
        onClick={onRemove}
        aria-label={`إزالة فلتر ${label}`}
        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gold/20"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/** Dropdown select styled to match the glass/gold theme, with an inline search box for long lists. */
function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  searchable = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    return options.filter((o) => o.includes(query));
  }, [options, query]);

  function select(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          setQuery("");
        }
      }}
    >
      <label className="field-label">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`field flex cursor-pointer items-center justify-between gap-2 text-right ${value ? "text-white" : "text-white/40"}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="animate-dropdown absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-line bg-bg-card shadow-2xl"
        >
          {searchable && (
            <div className="border-b border-line p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث..."
                aria-label={`بحث في ${label}`}
                className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto p-1.5">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => select("")}
              className={`flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 text-right text-sm transition-colors hover:bg-gold/10 focus-visible:bg-gold/10 focus-visible:outline-none ${
                !value ? "text-gold" : "text-white/70"
              }`}
            >
              {placeholder}
            </button>
            {filteredOptions.length === 0 && (
              <p className="px-3 py-3 text-center text-xs text-white/30">لا توجد نتائج</p>
            )}
            {filteredOptions.map((o) => (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={value === o}
                onClick={() => select(o)}
                className={`flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 text-right text-sm transition-colors hover:bg-gold/10 focus-visible:bg-gold/10 focus-visible:outline-none ${
                  value === o ? "text-gold" : "text-white/70"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
