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
  gallery       jsonb default '[]'::jsonb,
  verified      boolean default false,
  status        text default 'pending' check (status in ('pending','approved','rejected')),
  socials       jsonb default '{}'::jsonb,
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

-- تفعيل Row Level Security
alter table public.influencers enable row level security;
alter table public.ad_requests enable row level security;

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
