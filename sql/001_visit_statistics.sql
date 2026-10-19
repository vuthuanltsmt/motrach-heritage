-- DI SAN MO TRACH | THONG KE LUOT TRUY CAP
-- Chay TOAN BO file trong Supabase Dashboard > SQL Editor (mot lan).
-- Du lieu chua truoc khi cai dat khong the khoi phuc tu script nay.
-- Khong can service_role key tren website.

-- Du lieu goc nam o schema khong public qua Data API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table if not exists private.site_visit_events (
    id bigint generated always as identity primary key,
    visited_at timestamptz not null default now(),
    page_path text not null,
    visitor_id uuid not null,
    session_id uuid not null,
    constraint site_visit_events_session_page_key unique (session_id, page_path),
    constraint site_visit_events_page_format check (
        page_path = '/index.html'
        or page_path ~ '^/pages/[a-z0-9-]+\.html$'
    )
);

create index if not exists site_visit_events_visited_at_idx
    on private.site_visit_events (visited_at);
create index if not exists site_visit_events_visitor_id_idx
    on private.site_visit_events (visitor_id);

alter table private.site_visit_events enable row level security;
revoke all on private.site_visit_events from public, anon, authenticated;

-- Noi bo: luu mot pageview cho moi trang trong mot phien.
create or replace function private.record_visit_event(
    p_page_path text,
    p_visitor_id uuid,
    p_session_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if p_page_path is null
       or length(p_page_path) > 160
       or (p_page_path <> '/index.html'
           and p_page_path !~ '^/pages/[a-z0-9-]+\.html$')
       or p_visitor_id is null
       or p_session_id is null then
        raise exception 'Invalid visit data' using errcode = '22023';
    end if;

    insert into private.site_visit_events(page_path, visitor_id, session_id)
    values (p_page_path, p_visitor_id, p_session_id)
    on conflict (session_id, page_path) do nothing;
end;
$$;

revoke all on function private.record_visit_event(text, uuid, uuid) from public;
grant execute on function private.record_visit_event(text, uuid, uuid) to anon, authenticated;

-- Public API: wrapper chay voi quyen nguoi goi, khong chua SECURITY DEFINER.
create or replace function public.record_site_visit(
    p_page_path text,
    p_visitor_id uuid,
    p_session_id uuid
)
returns void
language sql
security invoker
set search_path = ''
as $$
    select private.record_visit_event(p_page_path, p_visitor_id, p_session_id);
$$;

revoke all on function public.record_site_visit(text, uuid, uuid) from public;
grant execute on function public.record_site_visit(text, uuid, uuid) to anon, authenticated;

-- Tong luot phien duoc hien thi cong khai tren trang chu.
create or replace function private.read_public_visit_total()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
    select count(distinct session_id)::bigint
    from private.site_visit_events;
$$;

revoke all on function private.read_public_visit_total() from public;
grant execute on function private.read_public_visit_total() to anon, authenticated;

create or replace function public.get_public_visit_total()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
    select private.read_public_visit_total();
$$;

revoke all on function public.get_public_visit_total() from public;
grant execute on function public.get_public_visit_total() to anon, authenticated;

-- Noi bo: bao cao chi danh cho tai khoan nam trong bang public.admins.
create or replace function private.read_admin_visit_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    v_result jsonb;
begin
    if (select auth.uid()) is null
       or not exists (
           select 1 from public.admins a
           where a.user_id = (select auth.uid())
       ) then
        raise exception 'Admin access required' using errcode = '42501';
    end if;

    select jsonb_build_object(
        'visits_total',
            (select count(distinct session_id) from private.site_visit_events),
        'visits_today',
            (select count(distinct session_id) from private.site_visit_events
             where (visited_at at time zone 'Asia/Ho_Chi_Minh')::date = v_today),
        'visits_7days',
            (select count(distinct session_id) from private.site_visit_events
             where (visited_at at time zone 'Asia/Ho_Chi_Minh')::date between v_today - 6 and v_today),
        'pageviews_total',
            (select count(*) from private.site_visit_events),
        'visitors_total',
            (select count(distinct visitor_id) from private.site_visit_events),
        'visitors_today',
            (select count(distinct visitor_id) from private.site_visit_events
             where (visited_at at time zone 'Asia/Ho_Chi_Minh')::date = v_today),
        'daily',
            (select coalesce(jsonb_agg(
                jsonb_build_object(
                    'date', to_char(v_today - 6 + g.i, 'DD/MM'),
                    'visits', (
                        select count(distinct session_id)
                        from private.site_visit_events e
                        where (e.visited_at at time zone 'Asia/Ho_Chi_Minh')::date = v_today - 6 + g.i
                    )
                ) order by g.i
            ), '[]'::jsonb) from generate_series(0, 6) as g(i)),
        'top_pages',
            (select coalesce(jsonb_agg(
                jsonb_build_object('path', r.page_path, 'views', r.views)
                order by r.views desc, r.page_path
            ), '[]'::jsonb)
            from (
                select page_path, count(*) as views
                from private.site_visit_events
                group by page_path
                order by views desc, page_path
                limit 5
            ) r)
    ) into v_result;

    return v_result;
end;
$$;

revoke all on function private.read_admin_visit_summary() from public;
grant execute on function private.read_admin_visit_summary() to authenticated;

create or replace function public.get_admin_visit_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
    select private.read_admin_visit_summary();
$$;

revoke all on function public.get_admin_visit_summary() from public, anon;
grant execute on function public.get_admin_visit_summary() to authenticated;
