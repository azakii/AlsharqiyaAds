import { redirect } from "next/navigation";
import { Crown } from "@/components/Icons";
import { currentInfluencerId } from "@/lib/userAuth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "تسجيل الدخول | إعلانات الشرقية" };

export default function LoginPage() {
  if (currentInfluencerId()) redirect("/account");

  return (
    <div className="bg-gold-radial">
      <div className="container-max flex min-h-[80vh] flex-col items-center justify-center py-16">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-gradient text-black shadow-gold">
          <Crown className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold gold-text">تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-white/50">ادخل لحسابك كمؤثر لإدارة ملفك الشخصي</p>
        <LoginForm />
      </div>
    </div>
  );
}
