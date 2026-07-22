import { Crown } from "@/components/Icons";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "تسجيل كمؤثر | إعلانات الشرقية" };

export default function RegisterPage() {
  return (
    <div className="bg-gold-radial">
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
