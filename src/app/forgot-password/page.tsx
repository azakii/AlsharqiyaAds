import { redirect } from "next/navigation";
import { Crown } from "@/components/Icons";
import { currentInfluencerId } from "@/lib/userAuth";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "نسيت كلمة المرور | إعلانات الشرقية" };

export default function ForgotPasswordPage() {
  if (currentInfluencerId()) redirect("/account");

  return (
    <div className="bg-gold-radial">
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
