-- MO TRACH HERITAGE | QR ANALYTICS V3
-- Run after sql/003_qr_management.sql has been installed.
-- This script is additive: does NOT modify the original QR records, banner,
-- QR event table, existing RPCs, website visitor counter, or authentication.
-- All dates and daily aggregations are in Asia/Ho_Chi_Minh (UTC+7).

create or replace function public.get_qr_daily_report(
  p_from date,
  p_to date
)
returns table (
  report_date date,
  site_slug text,
  title_vi text,
  opens bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- Never expose private QR event data directly to unauthenticated users.
  if auth.uid() is null or not exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  ) then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  if p_from is null or p_to is null
     or p_from > p_to
     or (p_to - p_from) > 365 then
    raise exception 'Invalid date range: choose 1 to 366 days'
      using errcode = '22023';
  end if;

  return query
  select
    days.day::date as report_date,
    sites.slug as site_slug,
    sites.title_vi as title_vi,
    count(events.id)::bigint as opens
  from generate_series(
      p_from::timestamp,
      p_to::timestamp,
      interval '1 day'
  ) as days(day)
  cross join public.heritage_qr_sites as sites
  left join private.heritage_qr_open_events as events
    on events.site_slug = sites.slug
   and events.opened_at >= (days.day at time zone 'Asia/Ho_Chi_Minh')
   and events.opened_at < ((days.day + interval '1 day') at time zone 'Asia/Ho_Chi_Minh')
  group by days.day, sites.slug, sites.title_vi, sites.sort_order
  order by days.day, sites.sort_order, sites.slug;
end;
$$;

revoke all on function public.get_qr_daily_report(date,date)
  from public, anon, authenticated;
grant execute on function public.get_qr_daily_report(date,date)
  to authenticated;

comment on function public.get_qr_daily_report(date,date) is
  'Admin-only, daily aggregated QR URL opens in Vietnam local dates; no raw visit IDs or IP addresses returned.';

-- Optional safe verification while signed in as the database owner (SQL Editor).
-- SELECT * FROM public.get_qr_daily_report(current_date - 6, current_date);
-- NOTE: SQL Editor roles may not have auth.uid(); the app's logged-in admin is
-- the recommended place to test the function. Do not grant this function to anon.
