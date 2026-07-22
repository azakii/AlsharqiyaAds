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

  const activeFilters = (city ? 1 : 0) + (category ? 1 : 0);

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
              className="flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-muted"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`glass flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              showFilters || activeFilters ? "text-gold" : "text-muted hover:text-gold"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> فلترة
            {activeFilters > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] text-bg">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="glass mt-3 grid gap-3 rounded-2xl p-4 sm:grid-cols-2">
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

      <p className="mt-8 text-center text-sm text-muted">
        عرض <span className="text-gold">{filtered.length}</span> مؤثر
      </p>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted">لا توجد نتائج مطابقة للبحث.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((inf) => (
            <InfluencerCard key={inf.id} inf={inf} />
          ))}
        </div>
      )}
    </section>
  );
}
