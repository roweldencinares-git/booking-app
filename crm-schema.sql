-- Rowel CRM Tables — add to your existing Supabase project
-- Run in Supabase SQL Editor

-- =============================================
-- MIGRATION: Add tags to contacts (run if upgrading)
-- =============================================
-- alter table crm_contacts add column if not exists tags text[] default '{}';
-- create index if not exists idx_crm_contacts_tags on crm_contacts using gin(tags);

create table if not exists crm_companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  website text,
  industry text,
  size text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists crm_contacts (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  company_id uuid references crm_companies(id) on delete set null,
  type text default 'lead' check (type in ('lead','customer','partner')),
  status text default 'active' check (status in ('active','inactive')),
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists crm_deals (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  value numeric(12,2) default 0,
  stage text default 'lead' check (stage in ('lead','qualified','proposal','negotiation','won','lost')),
  contact_id uuid references crm_contacts(id) on delete set null,
  company_id uuid references crm_companies(id) on delete set null,
  close_date date,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists crm_activities (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('note','call','email','meeting')),
  content text not null,
  contact_id uuid references crm_contacts(id) on delete cascade,
  deal_id uuid references crm_deals(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists crm_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  due_date timestamptz,
  priority text default 'medium' check (priority in ('low','medium','high')),
  completed boolean default false,
  contact_id uuid references crm_contacts(id) on delete set null,
  deal_id uuid references crm_deals(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_crm_contacts_company on crm_contacts(company_id);
create index if not exists idx_crm_deals_stage on crm_deals(stage);
create index if not exists idx_crm_deals_contact on crm_deals(contact_id);
create index if not exists idx_crm_activities_contact on crm_activities(contact_id);
create index if not exists idx_crm_tasks_completed on crm_tasks(completed);
create index if not exists idx_crm_tasks_due on crm_tasks(due_date);

-- Auto-update updated_at (reuse existing function if already exists)
create or replace function update_updated_at_column()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger crm_companies_updated before update on crm_companies for each row execute function update_updated_at_column();
create trigger crm_contacts_updated before update on crm_contacts for each row execute function update_updated_at_column();
create trigger crm_deals_updated before update on crm_deals for each row execute function update_updated_at_column();
create trigger crm_tasks_updated before update on crm_tasks for each row execute function update_updated_at_column();
