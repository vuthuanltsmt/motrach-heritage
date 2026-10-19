-- MO TRACH HERITAGE | QUAN LY BANNER DIEN ANH
-- Chay mot lan tren DUNG DU AN Supabase motrach-heritage.
-- Khong xoa hay sua bang posts/admins/site_visit_events dang su dung.
-- Khong dua file SQL nay vao website GitHub Pages.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Quyen quan tri kiem tra o database (khong tin tu giao dien/JavaScript).
create or replace function private.is_motrach_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
     and exists (
       select 1 from public.admins a
       where a.user_id = (select auth.uid())
     );
$$;
revoke all on function private.is_motrach_admin() from public, anon;
grant execute on function private.is_motrach_admin() to authenticated;

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  image_url text not null check (length(image_url) between 5 and 2048),
  storage_path text,
  title_vi text not null check (length(title_vi) between 1 and 120),
  title_en text not null default '' check (length(title_en) <= 120),
  description_vi text not null default '' check (length(description_vi) <= 220),
  description_en text not null default '' check (length(description_en) <= 220),
  sort_order integer not null default 100 check (sort_order between 0 and 100000),
  duration_ms integer not null default 6500 check (duration_ms between 3000 and 20000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_banners_active_order_idx
on public.site_banners (is_active, sort_order, created_at);

-- Tat ca operations write va xem banner an deu phai la admin.
alter table public.site_banners enable row level security;

drop policy if exists "Banner public: read active" on public.site_banners;
create policy "Banner public: read active" on public.site_banners
for select to anon, authenticated
using (is_active = true);

drop policy if exists "Banner admin: read all" on public.site_banners;
create policy "Banner admin: read all" on public.site_banners
for select to authenticated
using ((select private.is_motrach_admin()));

drop policy if exists "Banner admin: insert" on public.site_banners;
create policy "Banner admin: insert" on public.site_banners
for insert to authenticated
with check ((select private.is_motrach_admin()));

drop policy if exists "Banner admin: update" on public.site_banners;
create policy "Banner admin: update" on public.site_banners
for update to authenticated
using ((select private.is_motrach_admin()))
with check ((select private.is_motrach_admin()));

drop policy if exists "Banner admin: delete" on public.site_banners;
create policy "Banner admin: delete" on public.site_banners
for delete to authenticated
using ((select private.is_motrach_admin()));

grant select on public.site_banners to anon, authenticated;
grant insert, update, delete on public.site_banners to authenticated;

-- Tu dong nap bon anh dang dung trong Banner v1.
-- ON CONFLICT dam bao chay lai file SQL khong ghi de noi dung da chinh sua.
insert into public.site_banners
  (seed_key, image_url, title_vi, title_en, description_vi, description_en, sort_order, duration_ms, is_active)
values
  ('original-lang-than', 'images/gallery/lang-than%202.jpg', 'Lăng Thần – Mộ cụ Vũ Hồn', 'Ancestral Shrine – Vu Hon', 'Khám phá dấu ấn nguồn cội của làng Mộ Trạch.', 'Explore the origins of Mo Trach village.', 10, 6500, true),
  ('original-van-mieu', 'images/van-mieu.jpg', 'Văn Miếu Mộ Trạch', 'Mo Trach Temple of Literature', 'Truyền thống hiếu học và khoa bảng.', 'A legacy of learning and scholarship.', 20, 6500, true),
  ('original-dinh-lang', 'images/dinh-lang.jpg', 'Đình làng Mộ Trạch', 'Mo Trach Communal House', 'Không gian lưu giữ văn hóa cộng đồng.', 'A place preserving community heritage.', 30, 6500, true),
  ('original-chua-dien-phuc', 'images/chua-dien-phuc.jpg', 'Chùa Diên Phúc', 'Dien Phuc Pagoda', 'Một điểm đến trong hành trình khám phá di sản.', 'A stop along the heritage journey.', 40, 6500, true)
on conflict (seed_key) do nothing;

-- Storage chi dung cho anh banner moi tai tu trang quan tri.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banner-images', 'banner-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Truy cap public bucket duoc phuc vu qua public URL; du lieu file chi admin co quyen thay doi.
drop policy if exists "MoTrach banners: admin list" on storage.objects;
create policy "MoTrach banners: admin list" on storage.objects
for select to authenticated
using (
  bucket_id = 'banner-images' and (select private.is_motrach_admin())
);

drop policy if exists "MoTrach banners: admin upload" on storage.objects;
create policy "MoTrach banners: admin upload" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'banner-images'
  and (select private.is_motrach_admin())
  and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists "MoTrach banners: admin change" on storage.objects;
create policy "MoTrach banners: admin change" on storage.objects
for update to authenticated
using (bucket_id = 'banner-images' and (select private.is_motrach_admin()))
with check (bucket_id = 'banner-images' and (select private.is_motrach_admin()));

drop policy if exists "MoTrach banners: admin remove" on storage.objects;
create policy "MoTrach banners: admin remove" on storage.objects
for delete to authenticated
using (bucket_id = 'banner-images' and (select private.is_motrach_admin()));


-- Doi thu tu NGUYEN TU (atomic) de khong co thu tu trung neu mang mat ket noi.
-- Ham co quyen cao nam trong schema private; public chi la wrapper INVOKER.
create or replace function private.reorder_site_banners_internal(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := coalesce(array_length(p_ids, 1), 0);
begin
  if not private.is_motrach_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if v_count = 0 or v_count > 100
     or v_count <> (select count(*) from public.site_banners)
     or v_count <> (select count(distinct x.id) from unnest(p_ids) as x(id))
     or v_count <> (select count(*) from public.site_banners where id = any(p_ids)) then
    raise exception 'Invalid banner order' using errcode = '22023';
  end if;
  update public.site_banners b
  set sort_order = (s.ordinality * 10)::integer,
      updated_at = now()
  from unnest(p_ids) with ordinality as s(id, ordinality)
  where b.id = s.id;
end;
$$;
revoke all on function private.reorder_site_banners_internal(uuid[]) from public, anon;
grant execute on function private.reorder_site_banners_internal(uuid[]) to authenticated;

create or replace function public.reorder_site_banners(p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.reorder_site_banners_internal(p_ids);
$$;
revoke all on function public.reorder_site_banners(uuid[]) from public, anon;
grant execute on function public.reorder_site_banners(uuid[]) to authenticated;

-- Kiem tra bang (co 4 banner mac dinh, tru khi da chinh sua truoc do).
select id, title_vi, sort_order, is_active from public.site_banners order by sort_order;
