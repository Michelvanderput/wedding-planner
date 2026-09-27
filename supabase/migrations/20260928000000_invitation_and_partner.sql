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
