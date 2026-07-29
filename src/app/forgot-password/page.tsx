import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Crown } from "@/components/Icons";
import { currentInfluencerId } from "@/lib/userAuth";
import ForgotPasswordForm from "./ForgotPasswordForm";
import StructuredData from "@/components/StructuredData";
import { getSeoForPath, buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoForPath("/forgot-password"), getSettings()]);
  return buildMetadata({
    path: "/forgot-password",
    seo,
    settings,
    fallback: { title: `نسيت كلمة المرور | ${settings.brand_name}`, description: settings.footer_about },
  });
}

export default async function ForgotPasswordPage() {
  if (currentInfluencerId()) redirect("/account");
  const seo = await getSeoForPath("/forgot-password");

  return (
    <div className="bg-gold-radial">
      {seo && <StructuredData blocks={seo.structured_data} />}
      <div className="container-max flex min-h-[80vh] flex-col items-center justify-center py-16">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-gradient text-black shadow-gold">
          <Crown className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold gold-text">نسيت كلمة المرور؟</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-white/50">
          أدخل بريدك الإلكتروني المسجل، وهنبعتلك رابط لإعادة تعيين كلمة المرور.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
