import type { Metadata } from "next";
import { Crown } from "@/components/Icons";
import ResetPasswordForm from "./ResetPasswordForm";
import StructuredData from "@/components/StructuredData";
import { getSeoForPath, buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoForPath("/reset-password"), getSettings()]);
  return buildMetadata({
    path: "/reset-password",
    seo,
    settings,
    fallback: { title: `إعادة تعيين كلمة المرور | ${settings.brand_name}`, description: settings.footer_about },
  });
}

export default async function ResetPasswordPage() {
  const seo = await getSeoForPath("/reset-password");
  return (
    <div className="bg-gold-radial">
      {seo && <StructuredData blocks={seo.structured_data} />}
      <div className="container-max flex min-h-[80vh] flex-col items-center justify-center py-16">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-gradient text-black shadow-gold">
          <Crown className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold gold-text">إعادة تعيين كلمة المرور</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-white/50">
          اختر كلمة مرور جديدة لحسابك.
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
