import { Crown } from "@/components/Icons";
import ResetPasswordForm from "./ResetPasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "إعادة تعيين كلمة المرور | إعلانات الشرقية" };

export default function ResetPasswordPage() {
  return (
    <div className="bg-gold-radial">
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
