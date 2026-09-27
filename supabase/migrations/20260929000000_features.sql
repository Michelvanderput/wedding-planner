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
