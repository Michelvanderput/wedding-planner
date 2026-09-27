-- ════════════════════════════════════════════════════════════════════
--  Bruiloftsplanner – initieel schema
--  Draai dit in de Supabase SQL-editor of met `supabase db push`.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Bruiloften ──────────────────────────────────────────────────────
create table if not exists public.weddings (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  partner_one     text not null default '',
  partner_two     text not null default '',
  wedding_date    date,
  ceremony_time   text,
  venue           text not null default '',
  city            text not null default '',
  budget_total    numeric(12,2) not null default 0,
  guest_estimate  integer not null default 0,
  style           text not null default '',
  color_palette   text[] not null default '{}',
  created_at      timestamptz not null default now()
);

-- Leden (zodat je partner / ceremoniemeester kan meeplannen)
create table if not exists public.wedding_members (
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'owner' check (role in ('owner','editor')),
  created_at  timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

-- Eigenaar automatisch als lid toevoegen
create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists weddings_add_owner on public.weddings;
create trigger weddings_add_owner
  after insert on public.weddings
  for each row execute function public.add_owner_as_member();

-- Helper voor RLS (security definer voorkomt recursieve policies)
create or replace function public.is_wedding_member(wid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.wedding_members
    where wedding_id = wid and user_id = auth.uid()
  );
$$;

-- ── Takenlijst ──────────────────────────────────────────────────────
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  title       text not null,
  category    text not null default 'Algemeen',
  due_date    date,
  done        boolean not null default false,
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

-- ── Tafels ──────────────────────────────────────────────────────────
create table if not exists public.seating_tables (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  name        text not null,
  capacity    integer not null default 8,
  shape       text not null default 'round' check (shape in ('round','rect')),
  created_at  timestamptz not null default now()
);

-- ── Gasten ──────────────────────────────────────────────────────────
create table if not exists public.guests (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  name        text not null,
  email       text not null default '',
  phone       text not null default '',
  side        text not null default 'both' check (side in ('partner_one','partner_two','both')),
  group_name  text not null default '',
  invited_to  text not null default 'day' check (invited_to in ('day','evening')),
  rsvp        text not null default 'pending' check (rsvp in ('pending','attending','declined')),
  plus_one    boolean not null default false,
  dietary     text not null default '',
  table_id    uuid references public.seating_tables(id) on delete set null,
  rsvp_token  uuid not null unique default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

-- ── Leveranciers ────────────────────────────────────────────────────
create table if not exists public.vendors (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references public.weddings(id) on delete cascade,
  name          text not null,
  category      text not null default 'Overig',
  contact_name  text not null default '',
  email         text not null default '',
  phone         text not null default '',
  website       text not null default '',
  price         numeric(12,2),
  status        text not null default 'idea' check (status in ('idea','contacted','quote','booked')),
  rating        integer check (rating between 1 and 5),
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

-- ── Budget ──────────────────────────────────────────────────────────
create table if not exists public.budget_items (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  category    text not null default 'Overig',
  name        text not null,
  estimated   numeric(12,2) not null default 0,
  actual      numeric(12,2) not null default 0,
  paid        boolean not null default false,
  vendor_id   uuid references public.vendors(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ── Dagplanning / draaiboek ─────────────────────────────────────────
create table if not exists public.timeline_events (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  start_time  text not null,
  end_time    text not null default '',
  title       text not null,
  location    text not null default '',
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

-- ── Inspiratie / moodboard ──────────────────────────────────────────
create table if not exists public.inspirations (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  image_url   text not null,
  prompt      text not null default '',
  note        text not null default '',
  category    text not null default 'Algemeen',
  created_at  timestamptz not null default now()
);

-- ── Indexen ─────────────────────────────────────────────────────────
create index if not exists tasks_wedding_idx           on public.tasks(wedding_id);
create index if not exists guests_wedding_idx          on public.guests(wedding_id);
create index if not exists vendors_wedding_idx         on public.vendors(wedding_id);
create index if not exists budget_items_wedding_idx    on public.budget_items(wedding_id);
create index if not exists timeline_events_wedding_idx on public.timeline_events(wedding_id);
create index if not exists seating_tables_wedding_idx  on public.seating_tables(wedding_id);
create index if not exists inspirations_wedding_idx    on public.inspirations(wedding_id);

-- ════════════════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.weddings        enable row level security;
alter table public.wedding_members enable row level security;
alter table public.tasks           enable row level security;
alter table public.guests          enable row level security;
alter table public.vendors         enable row level security;
alter table public.budget_items    enable row level security;
alter table public.timeline_events enable row level security;
alter table public.seating_tables  enable row level security;
alter table public.inspirations    enable row level security;

drop policy if exists "weddings_select" on public.weddings;
create policy "weddings_select" on public.weddings
  for select using (owner_id = auth.uid() or public.is_wedding_member(id));

drop policy if exists "weddings_insert" on public.weddings;
create policy "weddings_insert" on public.weddings
  for insert with check (owner_id = auth.uid());

drop policy if exists "weddings_update" on public.weddings;
create policy "weddings_update" on public.weddings
  for update using (public.is_wedding_member(id));

drop policy if exists "weddings_delete" on public.weddings;
create policy "weddings_delete" on public.weddings
  for delete using (owner_id = auth.uid());

drop policy if exists "members_select" on public.wedding_members;
create policy "members_select" on public.wedding_members
  for select using (public.is_wedding_member(wedding_id));

drop policy if exists "members_manage" on public.wedding_members;
create policy "members_manage" on public.wedding_members
  for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_id = auth.uid())
  );

-- Zelfde policy voor alle onderliggende tabellen
do $$
declare t text;
begin
  foreach t in array array['tasks','guests','vendors','budget_items','timeline_events','seating_tables','inspirations']
  loop
    execute format('drop policy if exists "%1$s_member_all" on public.%1$I', t);
    execute format(
      'create policy "%1$s_member_all" on public.%1$I for all
         using (public.is_wedding_member(wedding_id))
         with check (public.is_wedding_member(wedding_id))', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  Publieke RSVP (gasten zonder account, via persoonlijke link)
-- ════════════════════════════════════════════════════════════════════
create or replace function public.get_rsvp(p_token uuid)
returns table (
  guest_name    text,
  rsvp          text,
  plus_one      boolean,
  dietary       text,
  invited_to    text,
  partner_one   text,
  partner_two   text,
  wedding_date  date,
  venue         text,
  city          text
) language sql stable security definer set search_path = public as $$
  select g.name, g.rsvp, g.plus_one, g.dietary, g.invited_to,
         w.partner_one, w.partner_two, w.wedding_date, w.venue, w.city
  from public.guests g
  join public.weddings w on w.id = g.wedding_id
  where g.rsvp_token = p_token;
$$;

create or replace function public.submit_rsvp(
  p_token uuid, p_rsvp text, p_plus_one boolean, p_dietary text
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_rsvp not in ('attending','declined') then
    raise exception 'invalid rsvp';
  end if;
  update public.guests
     set rsvp = p_rsvp,
         plus_one = coalesce(p_plus_one, false),
         dietary = left(coalesce(p_dietary, ''), 500)
   where rsvp_token = p_token;
  return found;
end $$;

grant execute on function public.get_rsvp(uuid) to anon, authenticated;
grant execute on function public.submit_rsvp(uuid, text, boolean, text) to anon, authenticated;
