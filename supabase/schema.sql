-- ============================================================
-- إعلانات الشرقية — مخطط قاعدة البيانات (Supabase / Postgres)
-- شغّل هذا الملف في: Supabase Dashboard > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";

-- جدول المؤثرين
create table if not exists public.influencers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text,
  email         text,
  city          text,
  category      text,
  bio           text,
  followers     integer default 0,
  views         integer default 0,
  clicks        integer default 0,
  ad_requests   integer default 0,
  avatar_url    text,
  verified      boolean default false,
  status        text default 'pending' check (status in ('pending','approved','rejected')),
  socials       jsonb default '{}'::jsonb,
  auth_user_id  uuid references auth.users(id) on delete set null,
  -- رقم رخصة منصة "موثوق" — خاص تماماً، لا يُعاد أبداً في القراءة العامة (anon key)،
  -- الفرونت يستخدم عمود مشتق (has_license) بدل قراءة هذا الرقم مباشرة على الصفحات العامة.
  license_number text,
  created_at    timestamptz default now()
);

-- جدول طلبات الإعلان
create table if not exists public.ad_requests (
  id                uuid primary key default gen_random_uuid(),
  company_name      text not null,
  contact_name      text,
  phone             text,
  email             text,
  category          text,
  city              text,
  details           text,
  budget            numeric default 0,
  target_influencer text,
  status            text default 'pending' check (status in ('pending','approved','rejected')),
  created_at        timestamptz default now()
);

-- جدول إعدادات الموقع (صف واحد id=1) — يتحكم فيه الأدمن من اللوحة
create table if not exists public.site_settings (
  id                integer primary key default 1,
  brand_name        text,
  brand_name_en     text,
  logo_url          text,
  hero_badge        text,
  hero_title        text,
  hero_subtitle     text,
  hero_image        text,
  cta_title         text,
  cta_text          text,
  footer_about      text,
  contact_phone     text,
  contact_email     text,
  contact_location  text,
  support_whatsapp  text,
  color_bg          text,
  color_gold        text,
  color_gold_light  text,
  color_gold_dark   text,
  updated_at        timestamptz default now(),
  constraint single_row check (id = 1)
);

-- ترقية آمنة لقاعدة بيانات سبق إنشاؤها (لا تؤثر إن كانت الجداول جديدة)
alter table public.site_settings add column if not exists support_whatsapp text;
alter table public.influencers drop column if exists gallery;
alter table public.influencers add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create index if not exists influencers_auth_user_id_idx on public.influencers(auth_user_id);
alter table public.influencers add column if not exists license_number text;

-- دالة زيادة العدادات (مشاهدات/نقرات/طلبات إعلان) بأمان وبدون تعارض عند الزيارات المتزامنة.
-- تُستدعى فقط من السيرفر (عبر مفتاح الخدمة)، والقائمة البيضاء لأسماء الأعمدة تمنع أي حقن SQL.
create or replace function public.increment_influencer_stat(influencer_id uuid, stat_column text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if stat_column = 'views' then
    update public.influencers set views = coalesce(views, 0) + 1 where id = influencer_id;
  elsif stat_column = 'clicks' then
    update public.influencers set clicks = coalesce(clicks, 0) + 1 where id = influencer_id;
  elsif stat_column = 'ad_requests' then
    update public.influencers set ad_requests = coalesce(ad_requests, 0) + 1 where id = influencer_id;
  end if;
end;
$$;

-- تفعيل Row Level Security
alter table public.influencers enable row level security;
alter table public.ad_requests enable row level security;
alter table public.site_settings enable row level security;

-- إعدادات الموقع تُقرأ من الجميع (لعرضها في الواجهة)
create policy "public read settings"
  on public.site_settings for select
  using (true);

-- المؤثرون المقبولون فقط يظهرون للعامة
create policy "public read approved influencers"
  on public.influencers for select
  using (status = 'approved');

-- أي زائر يستطيع إرسال طلب تسجيل (يبقى pending)
create policy "anyone can submit influencer"
  on public.influencers for insert
  with check (status = 'pending');

-- أي زائر يستطيع إرسال طلب إعلان
create policy "anyone can submit ad request"
  on public.ad_requests for insert
  with check (true);

-- ملاحظة: عمليات الأدمن (قراءة الكل / تعديل / حذف) تتم عبر مفتاح الخدمة
-- (SUPABASE_SERVICE_ROLE_KEY) من السيرفر، وهو يتجاوز سياسات RLS.

-- ملاحظة عن حسابات المؤثرين: يتم إنشاء حساب Supabase Auth (auth.users) وربطه بـ
-- influencers.auth_user_id فور التسجيل، لكن تسجيل الدخول الفعلي يُمنع من السيرفر
-- (loginInfluencer في actions.ts) ما لم يكن status = 'approved' — أي أن الحساب لا
-- يعمل فعلياً إلا بعد موافقة الإدارة، رغم أن بيانات الدخول تُنشأ مسبقاً.

-- ملاحظة عن license_number: عمود خام لا يُفلتر بواسطة RLS (RLS يتحكم بالصفوف لا بالأعمدة)،
-- لذلك الحماية تتم من طبقة التطبيق: data.ts يحذف هذا الحقل من أي استعلام عام (anon key)
-- ويستبدله بحقل مشتق آمن (has_license: boolean) — فقط الإدارة (service role) وصاحب
-- الملف نفسه (عبر جلسته المسجّلة) يقدروا يشوفوا الرقم الفعلي.

-- تخزين الصور: أنشئ Bucket عام باسم "media" من Storage في اللوحة
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- بيانات أولية اختيارية (يمكن حذفها)
insert into public.influencers (name, city, category, bio, followers, avatar_url, verified, status, socials)
values
  ('خالد العتيبي', 'الدمام', 'تقنية', 'صانع محتوى تقني متخصص في مراجعة الأجهزة الذكية.', 125000, '', true, 'approved', '{"instagram":"https://instagram.com"}'),
  ('فهد العنزي', 'القطيف', 'رياضة', 'لاعب كرة قدم سابق ومعلق رياضي.', 180000, '', true, 'approved', '{"x":"https://x.com"}')
on conflict do nothing;
