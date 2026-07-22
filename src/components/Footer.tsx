import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import Logo from "./Logo";
import { Crown } from "./Icons";
import { SITE } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line/60 bg-bg-soft">
      <div className="container-max grid gap-10 py-14 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/50">{SITE.description}</p>
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
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" />{SITE.phone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" />{SITE.email}</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{SITE.location}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/40">
        <div className="container-max flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} {SITE.name}. جميع الحقوق محفوظة.</span>
          <span className="flex items-center gap-2 text-gold/70">
            <Crown className="h-3.5 w-3.5" /> صُنع في المنطقة الشرقية
          </span>
        </div>
      </div>
    </footer>
  );
}
