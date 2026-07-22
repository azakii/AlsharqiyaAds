import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import Logo from "./Logo";
import { Crown } from "./Icons";
import type { SiteSettings } from "@/lib/settings";

export default function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-20 border-t border-line/60 bg-bg-soft">
      <div className="container-max grid gap-10 py-14 md:grid-cols-3">
        <div>
          <Logo brandName={settings.brand_name} brandNameEn={settings.brand_name_en} logoUrl={settings.logo_url} />
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/50">{settings.footer_about}</p>
        </div>

        <div>
          <h4 className="mb-4 font-display text-gold">روابط سريعة</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li><Link href="/" className="hover:text-gold">الرئيسية</Link></li>
            <li><Link href="/register" className="hover:text-gold">تسجيل كمؤثر</Link></li>
            <li><Link href="/ad-request" className="hover:text-gold">طلب إعلان</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-display text-gold">تواصل معنا</h4>
          <ul className="space-y-3 text-sm text-white/60">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" />{settings.contact_phone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" />{settings.contact_email}</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{settings.contact_location}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/40">
        <div className="container-max flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} {settings.brand_name}. جميع الحقوق محفوظة.</span>
          <span className="flex items-center gap-2 text-gold/70">
            <Crown className="h-3.5 w-3.5" /> صُنع في المنطقة الشرقية
          </span>
        </div>
      </div>
    </footer>
  );
}
