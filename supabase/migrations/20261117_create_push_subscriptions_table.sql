create table public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);
alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from anon, authenticated;
