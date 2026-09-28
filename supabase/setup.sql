-- ============================================================================
-- Ja, ik wil! · volledige database-installatie in één keer
--
-- Gebruik: Supabase → SQL Editor → New query → plak dit hele bestand → Run.
-- Dit zijn de drie bestanden uit supabase/migrations/ achter elkaar, in één
-- transactie: lukt één stap niet, dan wordt er niets half aangemaakt.
--
-- Let op: gebruik óf dit bestand, óf de automatische GitHub-integratie; niet allebei.
-- ============================================================================
begin;

-- ---------------------------------------------------------------------------
-- 20260927000000_init.sql
-- ---------------------------------------------------------------------------
-- ════════════════════════════════════════════════════════════════════
--  Bruiloftsplanner – initieel schema
--  Draai dit in de Supabase SQL-editor of met `supabase db push`.
-- ════════════════════════════════════════════════════════════════════


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


-- ---------------------------------------------------------------------------
-- 20260928000000_invitation_and_partner.sql
-- ---------------------------------------------------------------------------
-- ════════════════════════════════════════════════════════════════════
--  Uitnodigingswebsite voor gasten + partnertoegang (max. 2 personen)
--  Draai dit NA 20260927000000_init.sql.
-- ════════════════════════════════════════════════════════════════════

-- ── Uitnodigingssite ────────────────────────────────────────────────
alter table public.weddings add column if not exists public_slug text;
alter table public.weddings add column if not exists site jsonb not null default '{}'::jsonb;

create unique index if not exists weddings_public_slug_key on public.weddings (public_slug);

alter table public.weddings drop constraint if exists weddings_public_slug_format;
alter table public.weddings add constraint weddings_public_slug_format
  check (public_slug is null or public_slug ~ '^[a-z0-9]([a-z0-9-]{1,58})[a-z0-9]$');

alter table public.timeline_events add column if not exists audience text not null default 'all';
alter table public.timeline_events drop constraint if exists timeline_events_audience_check;
alter table public.timeline_events add constraint timeline_events_audience_check
  check (audience in ('all','day','private'));

-- Publieke gegevens van een bruiloft (nooit budget, gasten of leveranciers).
-- p_invited: 'evening' → alleen onderdelen voor iedereen; anders ook daggast-onderdelen.
create or replace function public.invitation_payload(w public.weddings, p_invited text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'partner_one',   w.partner_one,
    'partner_two',   w.partner_two,
    'wedding_date',  w.wedding_date,
    'ceremony_time', w.ceremony_time,
    'venue',         w.venue,
    'city',          w.city,
    'color_palette', to_jsonb(w.color_palette),
    'site',          w.site,
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object(
               'start_time', e.start_time, 'end_time', e.end_time, 'title', e.title,
               'location', e.location, 'notes', e.notes, 'audience', e.audience)
             order by e.start_time)
      from public.timeline_events e
      where e.wedding_id = w.id
        and e.audience <> 'private'
        and (p_invited is distinct from 'evening' or e.audience = 'all')
    ), '[]'::jsonb)
  );
$$;
revoke execute on function public.invitation_payload(public.weddings, text) from public, anon, authenticated;

-- Persoonlijke uitnodiging via de RSVP-link van een gast
create or replace function public.get_invitation(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.invitation_payload(w, g.invited_to) || jsonb_build_object(
    'guest', jsonb_build_object(
      'name', g.name, 'invited_to', g.invited_to, 'rsvp', g.rsvp,
      'plus_one', g.plus_one, 'dietary', g.dietary))
  from public.guests g
  join public.weddings w on w.id = g.wedding_id
  where g.rsvp_token = p_token;
$$;

-- Algemene, deelbare pagina (alleen als het bruidspaar hem heeft gepubliceerd)
create or replace function public.get_wedding_site(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.invitation_payload(w, null)
  from public.weddings w
  where w.public_slug = lower(p_slug)
    and coalesce((w.site->>'published')::boolean, false);
$$;

grant execute on function public.get_invitation(uuid) to anon, authenticated;
grant execute on function public.get_wedding_site(text) to anon, authenticated;

-- ── Partnertoegang ──────────────────────────────────────────────────
-- Maximaal twee personen (het bruidspaar) per bruiloft.
create or replace function public.enforce_member_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.wedding_members where wedding_id = new.wedding_id) >= 2 then
    raise exception 'Deze bruiloft heeft al twee beheerders' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists wedding_members_limit on public.wedding_members;
create trigger wedding_members_limit
  before insert on public.wedding_members
  for each row execute function public.enforce_member_limit();

create table if not exists public.wedding_invites (
  code        text primary key,
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  created_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expires_at  timestamptz not null default now() + interval '14 days',
  used_by     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.wedding_invites enable row level security;

drop policy if exists "invites_owner_select" on public.wedding_invites;
create policy "invites_owner_select" on public.wedding_invites
  for select using (exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_id = auth.uid()));

drop policy if exists "invites_owner_delete" on public.wedding_invites;
create policy "invites_owner_delete" on public.wedding_invites
  for delete using (exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_id = auth.uid()));

-- Eigenaar maakt een uitnodigingscode voor de partner
create or replace function public.create_partner_invite(p_wedding uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not exists (select 1 from public.weddings where id = p_wedding and owner_id = auth.uid()) then
    raise exception 'Alleen de eigenaar kan een partner uitnodigen' using errcode = '42501';
  end if;
  if (select count(*) from public.wedding_members where wedding_id = p_wedding) >= 2 then
    raise exception 'Deze bruiloft heeft al twee beheerders' using errcode = 'P0001';
  end if;
  delete from public.wedding_invites where wedding_id = p_wedding and used_by is null;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.wedding_invites (code, wedding_id) values (v_code, p_wedding);
  return v_code;
end $$;

-- Partner accepteert de code (moet ingelogd zijn)
create or replace function public.accept_partner_invite(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inv public.wedding_invites;
begin
  if auth.uid() is null then
    raise exception 'Log eerst in' using errcode = '42501';
  end if;
  select * into v_inv from public.wedding_invites
   where code = upper(trim(p_code)) and used_by is null and expires_at > now();
  if not found then
    raise exception 'Deze uitnodigingscode is ongeldig of verlopen' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.wedding_members where wedding_id = v_inv.wedding_id and user_id = auth.uid()) then
    return v_inv.wedding_id;
  end if;
  if exists (select 1 from public.wedding_members where user_id = auth.uid()) then
    raise exception 'Je beheert al een andere bruiloft' using errcode = 'P0001';
  end if;
  insert into public.wedding_members (wedding_id, user_id, role) values (v_inv.wedding_id, auth.uid(), 'editor');
  update public.wedding_invites set used_by = auth.uid() where code = v_inv.code;
  return v_inv.wedding_id;
end $$;

-- Wie beheren deze bruiloft? (met e-mailadres)
create or replace function public.get_wedding_members(p_wedding uuid)
returns table (user_id uuid, role text, email text, is_me boolean)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.role, u.email::text, m.user_id = auth.uid()
  from public.wedding_members m
  join auth.users u on u.id = m.user_id
  where m.wedding_id = p_wedding and public.is_wedding_member(p_wedding)
  order by m.created_at;
$$;

-- Eigenaar haalt partner weg, of partner verlaat de bruiloft zelf
create or replace function public.remove_wedding_member(p_wedding uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.weddings where id = p_wedding and owner_id = p_user) then
    raise exception 'De eigenaar kan niet worden verwijderd' using errcode = 'P0001';
  end if;
  if not (p_user = auth.uid()
          or exists (select 1 from public.weddings where id = p_wedding and owner_id = auth.uid())) then
    raise exception 'Geen toestemming' using errcode = '42501';
  end if;
  delete from public.wedding_members where wedding_id = p_wedding and user_id = p_user;
end $$;

revoke execute on function public.create_partner_invite(uuid) from anon;
revoke execute on function public.accept_partner_invite(text) from anon;
revoke execute on function public.get_wedding_members(uuid) from anon;
revoke execute on function public.remove_wedding_member(uuid, uuid) from anon;
grant execute on function public.create_partner_invite(uuid) to authenticated;
grant execute on function public.accept_partner_invite(text) to authenticated;
grant execute on function public.get_wedding_members(uuid) to authenticated;
grant execute on function public.remove_wedding_member(uuid, uuid) to authenticated;

-- Leden mogen zichzelf niet via de API toevoegen; dat gaat alleen via accept_partner_invite.
drop policy if exists "members_manage" on public.wedding_members;

-- Eigenaarschap kan niet via een update worden overgenomen.
create or replace function public.prevent_owner_change()
returns trigger language plpgsql as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Eigenaar kan niet worden gewijzigd' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists weddings_owner_immutable on public.weddings;
create trigger weddings_owner_immutable
  before update on public.weddings
  for each row execute function public.prevent_owner_change();

-- Is een uitnodigingslink nog vrij? (zonder andere bruiloften te kunnen zien)
create or replace function public.slug_available(p_slug text, p_wedding uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.weddings where public_slug = lower(p_slug) and id <> p_wedding
  );
$$;
revoke execute on function public.slug_available(text, uuid) from anon;
grant execute on function public.slug_available(text, uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 20260929000000_features.sql
-- ---------------------------------------------------------------------------
-- ════════════════════════════════════════════════════════════════════
--  Extra functies: taken toewijzen, betaaldata, menukeuze + eigen
--  RSVP-vragen, cadeaulijst, fotolijst, gastenboek en documenten.
--  Draai dit NA 20260928000000_invitation_and_partner.sql.
-- ════════════════════════════════════════════════════════════════════

-- ── Taken: wie doet het? ────────────────────────────────────────────
alter table public.tasks add column if not exists assignee text not null default '';

-- ── Budget: betaaldatum en aanbetaling ──────────────────────────────
alter table public.budget_items add column if not exists due_date date;
alter table public.budget_items add column if not exists deposit numeric(12,2) not null default 0;
alter table public.budget_items add column if not exists deposit_paid boolean not null default false;

-- ── Gasten: menukeuze en antwoorden op eigen vragen ─────────────────
alter table public.guests add column if not exists meal text not null default '';
alter table public.guests add column if not exists answers jsonb not null default '{}'::jsonb;

-- ── Cadeaulijst ─────────────────────────────────────────────────────
create table if not exists public.gifts (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  url          text not null default '',
  image_url    text not null default '',
  price        numeric(12,2),
  kind         text not null default 'item' check (kind in ('item','fund')),
  quantity     integer not null default 1 check (quantity between 1 and 99),
  created_at   timestamptz not null default now()
);

create table if not exists public.gift_claims (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  gift_id     uuid not null references public.gifts(id) on delete cascade,
  guest_id    uuid references public.guests(id) on delete cascade,
  name        text not null default '',
  amount      numeric(12,2),
  created_at  timestamptz not null default now()
);
create index if not exists gift_claims_gift_idx on public.gift_claims(gift_id);

-- ── Fotolijst voor de fotograaf ─────────────────────────────────────
create table if not exists public.shots (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  title       text not null,
  category    text not null default 'Overig',
  notes       text not null default '',
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── Gastenboek (felicitaties op de uitnodiging) ─────────────────────
create table if not exists public.guestbook (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  guest_id    uuid references public.guests(id) on delete set null,
  name        text not null,
  message     text not null check (char_length(message) between 1 and 1000),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── Documenten (contracten, offertes) ───────────────────────────────
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  vendor_id   uuid references public.vendors(id) on delete set null,
  name        text not null,
  path        text not null,
  size        bigint not null default 0,
  mime        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists gifts_wedding_idx on public.gifts(wedding_id);
create index if not exists shots_wedding_idx on public.shots(wedding_id);
create index if not exists guestbook_wedding_idx on public.guestbook(wedding_id);
create index if not exists documents_wedding_idx on public.documents(wedding_id);

alter table public.gifts       enable row level security;
alter table public.gift_claims enable row level security;
alter table public.shots       enable row level security;
alter table public.guestbook   enable row level security;
alter table public.documents   enable row level security;

do $$
declare t text;
begin
  foreach t in array array['gifts','gift_claims','shots','guestbook','documents']
  loop
    execute format('drop policy if exists "%1$s_member_all" on public.%1$I', t);
    execute format(
      'create policy "%1$s_member_all" on public.%1$I for all
         using (public.is_wedding_member(wedding_id))
         with check (public.is_wedding_member(wedding_id))', t);
  end loop;
end $$;

-- ── Opslag voor documenten (privé bucket, per bruiloft een map) ─────
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;

drop policy if exists "documents_member_read" on storage.objects;
create policy "documents_member_read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_wedding_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "documents_member_insert" on storage.objects;
create policy "documents_member_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.is_wedding_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "documents_member_delete" on storage.objects;
create policy "documents_member_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.is_wedding_member(((storage.foldername(name))[1])::uuid));

-- ════════════════════════════════════════════════════════════════════
--  Functies voor gasten (via hun persoonlijke token)
-- ════════════════════════════════════════════════════════════════════

-- Uitnodiging: nu ook menukeuze, antwoorden, cadeaulijst en gastenboek
create or replace function public.invitation_extras(w public.weddings, p_guest uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'gifts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'title', g.title, 'description', g.description, 'url', g.url,
        'image_url', g.image_url, 'price', g.price, 'kind', g.kind, 'quantity', g.quantity,
        'claimed', (select count(*) from public.gift_claims c where c.gift_id = g.id),
        'raised', (select coalesce(sum(c.amount), 0) from public.gift_claims c where c.gift_id = g.id),
        'mine', (p_guest is not null and exists (select 1 from public.gift_claims c where c.gift_id = g.id and c.guest_id = p_guest))
      ) order by g.created_at)
      from public.gifts g where g.wedding_id = w.id), '[]'::jsonb),
    'guestbook', coalesce((
      select jsonb_agg(jsonb_build_object('name', b.name, 'message', b.message, 'created_at', b.created_at) order by b.created_at desc)
      from (select * from public.guestbook where wedding_id = w.id and not hidden order by created_at desc limit 100) b), '[]'::jsonb)
  );
$$;
revoke execute on function public.invitation_extras(public.weddings, uuid) from public, anon, authenticated;

create or replace function public.get_invitation(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.invitation_payload(w, g.invited_to)
      || public.invitation_extras(w, g.id)
      || jsonb_build_object('guest', jsonb_build_object(
           'name', g.name, 'invited_to', g.invited_to, 'rsvp', g.rsvp,
           'plus_one', g.plus_one, 'dietary', g.dietary, 'meal', g.meal, 'answers', g.answers))
  from public.guests g
  join public.weddings w on w.id = g.wedding_id
  where g.rsvp_token = p_token;
$$;

create or replace function public.get_wedding_site(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.invitation_payload(w, null) || public.invitation_extras(w, null)
  from public.weddings w
  where w.public_slug = lower(p_slug)
    and coalesce((w.site->>'published')::boolean, false);
$$;

-- RSVP met menukeuze en eigen vragen
create or replace function public.submit_rsvp_v2(
  p_token uuid, p_rsvp text, p_plus_one boolean, p_dietary text, p_meal text, p_answers jsonb
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_rsvp not in ('attending','declined') then
    raise exception 'invalid rsvp' using errcode = 'P0001';
  end if;
  if p_answers is not null and (jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 5000) then
    raise exception 'invalid answers' using errcode = 'P0001';
  end if;
  update public.guests
     set rsvp = p_rsvp,
         plus_one = coalesce(p_plus_one, false),
         dietary = left(coalesce(p_dietary, ''), 500),
         meal = left(coalesce(p_meal, ''), 100),
         answers = coalesce(p_answers, '{}'::jsonb)
   where rsvp_token = p_token;
  return found;
end $$;

-- Cadeau reserveren / vrijgeven
create or replace function public.claim_gift(p_token uuid, p_gift uuid, p_amount numeric default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_guest public.guests; v_gift public.gifts;
begin
  select * into v_guest from public.guests where rsvp_token = p_token;
  if not found then raise exception 'Onbekende uitnodiging' using errcode = 'P0001'; end if;
  select * into v_gift from public.gifts where id = p_gift and wedding_id = v_guest.wedding_id for update;
  if not found then raise exception 'Onbekend cadeau' using errcode = 'P0001'; end if;
  if v_gift.kind = 'item' then
    if exists (select 1 from public.gift_claims where gift_id = p_gift and guest_id = v_guest.id) then return true; end if;
    if (select count(*) from public.gift_claims where gift_id = p_gift) >= v_gift.quantity then
      raise exception 'Dit cadeau is al gereserveerd' using errcode = 'P0001';
    end if;
    insert into public.gift_claims (wedding_id, gift_id, guest_id, name) values (v_guest.wedding_id, p_gift, v_guest.id, v_guest.name);
  else
    if p_amount is null or p_amount <= 0 or p_amount > 100000 then
      raise exception 'Ongeldig bedrag' using errcode = 'P0001';
    end if;
    insert into public.gift_claims (wedding_id, gift_id, guest_id, name, amount) values (v_guest.wedding_id, p_gift, v_guest.id, v_guest.name, round(p_amount, 2));
  end if;
  return true;
end $$;

create or replace function public.unclaim_gift(p_token uuid, p_gift uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from public.gift_claims c
   using public.guests g
   where g.rsvp_token = p_token and c.guest_id = g.id and c.gift_id = p_gift;
  return found;
end $$;

-- Felicitatie in het gastenboek
create or replace function public.add_guestbook_entry(p_token uuid, p_message text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_guest public.guests;
begin
  select * into v_guest from public.guests where rsvp_token = p_token;
  if not found then raise exception 'Onbekende uitnodiging' using errcode = 'P0001'; end if;
  if char_length(trim(coalesce(p_message, ''))) = 0 then raise exception 'Leeg bericht' using errcode = 'P0001'; end if;
  if (select count(*) from public.guestbook where guest_id = v_guest.id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Even wachten voordat je nog een bericht plaatst' using errcode = 'P0001';
  end if;
  insert into public.guestbook (wedding_id, guest_id, name, message)
  values (v_guest.wedding_id, v_guest.id, v_guest.name, left(trim(p_message), 1000));
  return true;
end $$;

grant execute on function public.submit_rsvp_v2(uuid, text, boolean, text, text, jsonb) to anon, authenticated;
grant execute on function public.claim_gift(uuid, uuid, numeric) to anon, authenticated;
grant execute on function public.unclaim_gift(uuid, uuid) to anon, authenticated;
grant execute on function public.add_guestbook_entry(uuid, text) to anon, authenticated;


commit;
