-- DI SAN MO TRACH: QR V2. Chay 1 lan tren Supabase SQL Editor.
-- Khong sua banner, site_visit_events, articles, Supabase Auth, hay cac anh QR cu.
create schema if not exists private;

create table if not exists public.heritage_qr_sites (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_vi text not null check (char_length(title_vi) between 1 and 160),
  title_en text not null default '',
  target_path text not null check (target_path ~ '^pages/(tram-[a-z0-9-]+|detail)\.html(\?id=[a-z0-9-]+)?$'),
  is_active boolean not null default true,
  sort_order integer not null default 10,
  updated_at timestamptz not null default now()
);

insert into public.heritage_qr_sites(slug,title_vi,title_en,target_path,sort_order)
values
('lang-than','Lăng Thần – Mộ cụ Vũ Hồn','Ancestral Shrine of Vũ Hồn','pages/tram-lang-than.html',10),
('van-mieu-mo-trach','Văn Miếu Mộ Trạch','Mộ Trạch Temple of Literature','pages/tram-van-mieu.html',20),
('dinh-lang-mo-trach','Đình làng Mộ Trạch','Mộ Trạch Communal House','pages/tram-dinh-lang.html',30),
('chua-dien-phuc','Chùa Diên Phúc','Diên Phúc Pagoda','pages/tram-chua-dien-phuc.html',40)
on conflict(slug) do nothing;

create table if not exists private.heritage_qr_open_events (
 id bigint generated always as identity primary key,
 site_slug text not null references public.heritage_qr_sites(slug) on delete restrict,
 opened_at timestamptz not null default now(),
 visit_id uuid not null
);
create index if not exists qr_open_events_site_time
 on private.heritage_qr_open_events(site_slug,opened_at desc);
create index if not exists qr_open_events_visit_time
 on private.heritage_qr_open_events(visit_id,site_slug,opened_at desc);

-- Kiem tra admin bang chinh bang public.admins va auth.uid(); tuong thich Admin V2.
create or replace function public.is_qr_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_qr_admin() from public,anon,authenticated;
grant execute on function public.is_qr_admin() to authenticated;

alter table public.heritage_qr_sites enable row level security;
revoke all on public.heritage_qr_sites from anon,authenticated;
grant select on public.heritage_qr_sites to anon,authenticated;
grant insert,update,delete on public.heritage_qr_sites to authenticated;

drop policy if exists "QR public read active" on public.heritage_qr_sites;
create policy "QR public read active" on public.heritage_qr_sites
  for select to anon,authenticated using (is_active = true);
drop policy if exists "QR admins read all" on public.heritage_qr_sites;
create policy "QR admins read all" on public.heritage_qr_sites
  for select to authenticated using ((select public.is_qr_admin()));
drop policy if exists "QR admins insert" on public.heritage_qr_sites;
create policy "QR admins insert" on public.heritage_qr_sites
  for insert to authenticated with check ((select public.is_qr_admin()));
drop policy if exists "QR admins update" on public.heritage_qr_sites;
create policy "QR admins update" on public.heritage_qr_sites
  for update to authenticated using ((select public.is_qr_admin())) with check ((select public.is_qr_admin()));
drop policy if exists "QR admins delete" on public.heritage_qr_sites;
create policy "QR admins delete" on public.heritage_qr_sites
  for delete to authenticated using ((select public.is_qr_admin()));

-- Ghi 1 luot mo / diem / ma phien trong vong 30 phut.
-- Khong thu thap IP / user agent; day la luot mo URL, khong xac minh thao tac camera.
create or replace function public.record_qr_open(p_slug text,p_visit_id uuid)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
 if p_visit_id is null or p_slug is null or length(p_slug)>90
    or not exists(select 1 from public.heritage_qr_sites
      where slug=p_slug and is_active) then
   return false;
 end if;
 if exists (select 1 from private.heritage_qr_open_events
            where site_slug=p_slug and visit_id=p_visit_id
              and opened_at > now()-interval '30 minutes') then
   return true;
 end if;
 insert into private.heritage_qr_open_events(site_slug,visit_id)
 values(p_slug,p_visit_id);
 return true;
end;
$$;
revoke all on function public.record_qr_open(text,uuid) from public,anon,authenticated;
grant execute on function public.record_qr_open(text,uuid) to anon,authenticated;

-- Chi quan tri vien xem duoc thong ke; an danh sach id phien.
create or replace function public.get_qr_admin_stats()
returns table (site_slug text, total_opens bigint, today_opens bigint, last7_opens bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.admins a where a.user_id=auth.uid()) then
  raise exception 'Admin role required' using errcode='42501';
 end if;
 return query
 select s.slug,
        count(e.id)::bigint,
        count(e.id) filter (where e.opened_at >=
         (date_trunc('day',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'))::bigint,
        count(e.id) filter (where e.opened_at >= now()-interval '7 days')::bigint
 from public.heritage_qr_sites s
 left join private.heritage_qr_open_events e on e.site_slug=s.slug
 group by s.slug;
end;
$$;
revoke all on function public.get_qr_admin_stats() from public,anon,authenticated;
grant execute on function public.get_qr_admin_stats() to authenticated;

-- Kiem tra: du kien 4 dong neu chua chinh sua.
select slug,title_vi,target_path,is_active from public.heritage_qr_sites order by sort_order;
