# إعلانات الشرقية — Eastern Province Ads

منصة/دليل رقمي للمشاهير وصنّاع المحتوى الموثّقين في المنطقة الشرقية، تربط الشركات بالمؤثرين.
مبني بـ **Next.js 14 (App Router) + TypeScript + Tailwind + Supabase**، بواجهة عربية RTL بثيم داكن/ذهبي.

## المميزات

- الصفحة الرئيسية: Hero + إحصائيات حيّة + استكشاف المؤثرين (بحث + فلترة) + CTA
- صفحة بروفايل مؤثر تفصيلية (`/influencer/[id]`)
- تسجيل مؤثر — فورم 4 خطوات
- طلب إعلان — فورم 3 خطوات
- لوحة إدارة محمية: إحصائيات + قبول/رفض/حذف المؤثرين وطلبات الإعلان

> **وضع تجريبي:** يعمل الموقع فوراً ببيانات تجريبية بدون قاعدة بيانات. أضف مفاتيح Supabase لتفعيل الحفظ الفعلي.

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # ثم عبّئ القيم
npm run dev
```

## ربط Supabase

1. أنشئ مشروع على [supabase.com](https://supabase.com).
2. من **SQL Editor**، شغّل محتوى `supabase/schema.sql`.
3. من **Project Settings > API** انسخ القيم إلى متغيرات البيئة:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (سري — للأدمن)
4. من **Storage** تأكد من وجود bucket عام باسم `media`.

## متغيرات البيئة

| المتغير | الوصف |
|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح الخدمة (سيرفر فقط) |
| `ADMIN_USERNAME` | اسم مستخدم الأدمن (افتراضي: admin) |
| `ADMIN_PASSWORD` | كلمة مرور الأدمن (افتراضي: Sharqiah@2026) |

## النشر على Vercel

1. ارفع المشروع على GitHub.
2. من Vercel: **Add New > Project > Import** الريبو.
3. أضف متغيرات البيئة أعلاه في **Settings > Environment Variables**.
4. Deploy. كل `git push` بعدها يُنشر تلقائياً.
