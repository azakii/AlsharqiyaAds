"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import InfluencerCard from "./InfluencerCard";
import { CITIES, CATEGORIES } from "@/lib/constants";
import type { Influencer } from "@/lib/types";

export default function InfluencerExplorer({ influencers }: { influencers: Influencer[] }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return influencers.filter((i) => {
      const matchQ =
        !q ||
        i.name.includes(q) ||
        i.city.includes(q) ||
        i.category.includes(q);
      const matchCity = !city || i.city === city;
      const matchCat = !category || i.category === category;
      return matchQ && matchCity && matchCat;
    });
  }, [influencers, q, city, category]);

  return (
    <section id="celebrities" className="container-max scroll-mt-24 py-20">
      <div className="text-center">
        <span className="badge-gold mx-auto">نخبة المؤثرين الموثّقين</span>
        <h2 className="mt-4 font-display text-4xl font-bold gold-text">استكشف المؤثرين</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/50">
          ابحث وصفِّ النتائج حسب المدينة، التصنيف، وعدد المتابعين
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن مؤثر بالاسم أو المدينة أو التصنيف..."
              className="field pr-11"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="btn-outline shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" /> فلترة
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-3 rounded-xl border border-line bg-black/30 p-4 sm:grid-cols-2">
            <select value={city} onChange={(e) => setCity(e.target.value)} className="field">
              <option value="">كل المدن</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              <option value="">كل التصنيفات</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-white/40">
        عرض <span className="text-gold">{filtered.length}</span> مؤثر
      </p>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-white/40">لا توجد نتائج مطابقة للبحث.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((inf) => (
            <InfluencerCard key={inf.id} inf={inf} />
          ))}
        </div>
      )}
    </section>
  );
}
