import type { Metadata } from "next";
import { Crown } from "@/components/Icons";
import RegisterForm from "./RegisterForm";
import StructuredData from "@/components/StructuredData";
import { getSeoForPath, buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoForPath("/register"), getSettings()]);
  return buildMetadata({
    path: "/register",
    seo,
    settings,
    fallback: { title: `تسجيل كمؤثر | ${settings.brand_name}`, description: settings.footer_about },
  });
}

export default async function RegisterPage() {
  const seo = await getSeoForPath("/register");
  return (
    <div className="bg-gold-radial">
      {seo && <StructuredData blocks={seo.structured_data} />}
      <div className="container-max py-16">
        <div className="mb-10 text-center">
          <span className="badge-gold mx-auto"><Crown className="h-3.5 w-3.5" /> انضم لنخبة المؤثرين</span>
          <h1 className="mt-4 font-display text-4xl font-bold gold-text">تسجيل مؤثر جديد</h1>
          <p className="mt-3 text-sm text-white/50">أكمل بياناتك لتظهر في دليل المشاهير الموثّقين</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
