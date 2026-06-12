-- Rank & Rent OS — Run in Supabase SQL Editor

create table if not exists rr_properties (
  id uuid default gen_random_uuid() primary key,
  domain text not null,
  niche text,
  location text,
  status text default 'building' check (status in ('building','ranked','available','rented','paused')),
  monthly_value numeric(10,2) default 0,
  gsc_property text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists rr_clients (
  id uuid default gen_random_uuid() primary key,
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  status text default 'prospect' check (status in ('prospect','active','paused','churned')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists rr_rentals (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references rr_properties(id) on delete cascade,
  client_id uuid references rr_clients(id) on delete cascade,
  monthly_fee numeric(10,2) not null,
  start_date date not null,
  end_date date,
  status text default 'active' check (status in ('active','paused','ended')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists rr_leads (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references rr_properties(id) on delete set null,
  name text,
  phone text,
  email text,
  message text,
  source text default 'organic',
  forwarded_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists rr_rankings (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references rr_properties(id) on delete cascade,
  keyword text not null,
  position integer,
  checked_at timestamptz default now()
);

-- Indexes
create index if not exists idx_rr_leads_property on rr_leads(property_id);
create index if not exists idx_rr_leads_created on rr_leads(created_at desc);
create index if not exists idx_rr_rentals_property on rr_rentals(property_id);
create index if not exists idx_rr_rentals_status on rr_rentals(status);
create index if not exists idx_rr_rankings_property on rr_rankings(property_id);

create or replace function update_updated_at_column()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger rr_properties_updated before update on rr_properties
  for each row execute function update_updated_at_column();

-- Sample data
insert into rr_properties (domain, niche, location, status, monthly_value) values
  ('beachhydrovac.com',         'Hydrovac',      'Vancouver BC',  'rented',    1200.00),
  ('kitchencompliancepros.com', 'Grease Trap',   'Multi-city',    'rented',    800.00),
  ('toledogreasetrap.com',      'Grease Trap',   'Toledo OH',     'ranked',    0),
  ('hydroexcavation.ca',        'Hydrovac',      'Toronto ON',    'available', 0);

insert into rr_clients (business_name, contact_name, email, phone, status) values
  ('Pacific Hydrovac Services', 'Mike Tanaka',    'mike@pacifichydrovac.com',   '+1 604-555-0201', 'active'),
  ('KCP Grease Solutions',      'Sandra Webb',    'sandra@kcpgrease.com',       '+1 416-555-0202', 'active');

insert into rr_rentals (property_id, client_id, monthly_fee, start_date, status)
select
  p.id, c.id,
  case when p.domain = 'beachhydrovac.com' then 1200.00 else 800.00 end,
  '2026-01-01',
  'active'
from rr_properties p, rr_clients c
where (p.domain = 'beachhydrovac.com' and c.business_name = 'Pacific Hydrovac Services')
   or (p.domain = 'kitchencompliancepros.com' and c.business_name = 'KCP Grease Solutions');

insert into rr_leads (property_id, name, phone, email, message, source, created_at)
select p.id, l.name, l.phone, l.email, l.msg, l.src, l.ts
from rr_properties p
cross join (values
  ('beachhydrovac.com', 'David Park',    '+1 604-555-0301', 'david@acmeconstruct.com', 'Need hydrovac for utility line exposure', 'organic',      now() - interval '2 days'),
  ('beachhydrovac.com', 'Rachel Moore',  '+1 604-555-0302', '',                         'Potholing quote for 3 locations',          'maps',         now() - interval '5 days'),
  ('kitchencompliancepros.com', 'Tony Garcia', '+1 419-555-0303', 'tony@toledodiner.com','Grease trap cleaning overdue',            'organic',      now() - interval '1 day'),
  ('kitchencompliancepros.com', 'Amy Chen',   '+1 416-555-0304', 'amy@foodcourt.ca',    'Monthly hood cleaning contract needed',    'organic',      now() - interval '3 days'),
  ('toledogreasetrap.com', 'Omar Hassan', '+1 419-555-0305', '',                        'Emergency grease trap backup',             'organic',      now() - interval '4 hours')
) as l(domain, name, phone, email, msg, src, ts)
where p.domain = l.domain;

insert into rr_rankings (property_id, keyword, position, checked_at)
select p.id, r.kw, r.pos, r.ts
from rr_properties p
cross join (values
  ('beachhydrovac.com',         'hydrovac vancouver',           2, now()),
  ('beachhydrovac.com',         'hydrovac excavation bc',       4, now()),
  ('kitchencompliancepros.com', 'grease trap cleaning toronto', 1, now()),
  ('kitchencompliancepros.com', 'hood cleaning service',        3, now()),
  ('toledogreasetrap.com',      'grease trap toledo',           5, now()),
  ('toledogreasetrap.com',      'grease trap cleaning ohio',    8, now()),
  ('hydroexcavation.ca',        'hydrovac toronto',             12, now())
) as r(domain, kw, pos, ts)
where p.domain = r.domain;
