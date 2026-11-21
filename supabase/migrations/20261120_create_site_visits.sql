create table public.site_visits (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  visit_day date not null,
  created_at timestamptz not null default now()
);
create index site_visits_day_idx on public.site_visits (visit_day);
create index site_visits_visitor_idx on public.site_visits (visitor_id);
alter table public.site_visits enable row level security;
revoke all on table public.site_visits from anon, authenticated;

create or replace function public.get_visit_stats(p_day date)
returns json
language sql
stable
set search_path = public
as $$
  select json_build_object(
    'total_visits', count(*),
    'today_visits', count(*) filter (where visit_day = p_day),
    'unique_visitors', count(distinct visitor_id),
    'unique_today', count(distinct visitor_id) filter (where visit_day = p_day)
  ) from public.site_visits;
$$;
revoke execute on function public.get_visit_stats(date) from public, anon, authenticated;
grant execute on function public.get_visit_stats(date) to service_role;
