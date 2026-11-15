create table public.bookings (
  booking_ref text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_name text not null,
  customer_phone text not null,
  pickup_address text not null,
  source text not null default 'Hubli, Karnataka',
  destination text not null,
  pickup_date text not null,
  pickup_time text not null default '06:00 AM',
  days integer not null default 1 check (days between 1 and 30),
  car_id text not null,
  car_name text not null,
  rate_per_km numeric not null default 0,
  driver_bata numeric not null default 0,
  package_min_km integer not null default 300,
  billed_km integer not null default 300,
  extra_km_beyond_package integer not null default 0,
  estimated_fare numeric not null default 0,
  notes text not null default '',
  status text not null default 'pending_confirmation'
    check (status in ('pending_confirmation','called_confirmed','driver_allotted','completed','cancelled')),
  agreed_terms boolean not null default false,
  channel text not null default 'website_direct'
);
create index bookings_created_at_idx on public.bookings (created_at desc);
create index bookings_status_idx on public.bookings (status);
alter table public.bookings enable row level security;
revoke all on table public.bookings from anon, authenticated;
