-- Flamingo Supabase schema for server-side custom admin authentication
-- Run this file in the Supabase SQL Editor.
-- Admin authentication and all admin CRUD now happen through the WebDev server
-- using SUPABASE_SERVICE_ROLE_KEY. No admin_users table is required.

create extension if not exists pgcrypto;

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'Za male slavljenike',
  title text not null,
  description text not null default '',
  price text not null,
  color text not null default 'lilac' check (color in ('lilac', 'coral', 'navy')),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.about_features (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'Sparkles',
  title text not null,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  storage_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  occasion text not null default 'Rođendan',
  message text not null default '',
  status text not null default 'novi' check (status in ('novi', 'potvrdjen', 'odbijen')),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists packages_updated_at on public.packages;
create trigger packages_updated_at before update on public.packages for each row execute procedure public.set_updated_at();
drop trigger if exists about_features_updated_at on public.about_features;
create trigger about_features_updated_at before update on public.about_features for each row execute procedure public.set_updated_at();
drop trigger if exists gallery_updated_at on public.gallery;
create trigger gallery_updated_at before update on public.gallery for each row execute procedure public.set_updated_at();

alter table public.packages enable row level security;
alter table public.about_features enable row level security;
alter table public.gallery enable row level security;
alter table public.reservations enable row level security;

-- Remove policies from the previous admin_users/Supabase Auth model if they exist.
drop policy if exists "Admins manage packages" on public.packages;
drop policy if exists "Admins manage about features" on public.about_features;
drop policy if exists "Admins manage gallery" on public.gallery;
drop policy if exists "Admins read reservations" on public.reservations;
drop policy if exists "Admins update reservations" on public.reservations;
drop policy if exists "Admins delete reservations" on public.reservations;
drop function if exists public.is_flamingo_admin();
drop table if exists public.admin_users cascade;

-- Public browser access is limited to active content. The server service-role
-- client bypasses RLS for authenticated admin CRUD and never reaches the browser.
drop policy if exists "Public reads active packages" on public.packages;
create policy "Public reads active packages" on public.packages for select using (is_active = true);
drop policy if exists "Public reads active about features" on public.about_features;
create policy "Public reads active about features" on public.about_features for select using (is_active = true);
drop policy if exists "Public reads active gallery" on public.gallery;
create policy "Public reads active gallery" on public.gallery for select using (is_active = true);

-- Anyone may submit an inquiry. Only the server service-role client reads or
-- changes reservations from the protected admin dashboard.
drop policy if exists "Anyone submits reservations" on public.reservations;
create policy "Anyone submits reservations" on public.reservations for insert with check (true);

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

drop policy if exists "Public reads gallery files" on storage.objects;
create policy "Public reads gallery files" on storage.objects for select using (bucket_id = 'gallery');
drop policy if exists "Admins upload gallery files" on storage.objects;
create policy "Admins upload gallery files" on storage.objects for insert with check (false);
drop policy if exists "Admins update gallery files" on storage.objects;
create policy "Admins update gallery files" on storage.objects for update using (false) with check (false);
drop policy if exists "Admins delete gallery files" on storage.objects;
create policy "Admins delete gallery files" on storage.objects for delete using (false);

-- Seed content. These rows are safe to re-run because each block only inserts when empty.
do $$
begin
  if not exists (select 1 from public.packages) then
    insert into public.packages (eyebrow, title, description, price, color, features, sort_order) values
      ('Za male slavljenike', 'Klasik paket', 'Sve što je potrebno za veselu, bezbrižnu proslavu u omiljenom kutku igraonice.', '1.200 RSD po osobi', 'lilac', '["2 sata u igraonici", "Animator za decu", "Sokovi i grickalice", "Tematska dekoracija"]', 1),
      ('Najčešći izbor', 'Premium paket', 'Naš najtraženiji paket za rođendan koji se dugo prepričava – od prvog do poslednjeg plesa.', '1.650 RSD po osobi', 'coral', '["2,5 sata u igraonici", "Premium torta po izboru", "Disco & karaoke žurka", "Fotografisanje trenutaka"]', 2),
      ('Za velike trenutke', 'Flamingo specijal', 'Potpuno personalizovana proslava za porodice koje žele baš sve – i još malo više.', '2.200 RSD po osobi', 'navy', '["3 sata ekskluzivnog prostora", "Torta sa ličnim dizajnom", "Kompletna dekoracija", "Poklon za slavljenika"]', 3);
  end if;
  if not exists (select 1 from public.about_features) then
    insert into public.about_features (icon, title, description, sort_order) values
      ('Coffee', 'Dva u jedan koncept', 'Spoj moderne dečije igraonice i vrhunske poslastičare gde roditelji mogu da uživaju dok se deca bezbedno igraju.', 1),
      ('Music', 'Dečija diskoteka', 'Posebno opremljen disko prostor sa svetlosnim efektima, disko kuglom, ozvučenjem i karaoke sistemom.', 2),
      ('Utensils', 'Domaće poslastice i kolači', 'Sveži kolači, torte, kupovi i topli napici napravljeni po tradicionalnoj recepturi, sa modernim twistom.', 3),
      ('ShieldCheck', 'Bezbedan i topao prostor', 'Prilagođene igračke, tobogani i podloge gde su sigurnost i čistoća uvek na prvom mestu.', 4),
      ('PartyPopper', 'Organizacija rođendana', 'Kompletna usluga proslave sa iskusnim animatorima, posluženjem i ukrašavanjem prostora.', 5),
      ('Heart', 'Klimatizovan ambijent', 'Moderan, svetao i čist enterijer osmišljen za maksimalan komfor dece i roditelja tokom cele godine.', 6),
      ('Armchair', 'Kutak za roditelje', 'Udobna sedišta u poslastičari sa odličnim pogledom na igralište – da i vaš predah bude pravi predah.', 7),
      ('MapPin', 'Odlična lokacija u Nišu', 'Smešteni smo u Cara Dušana 162, na pristupačnoj lokaciji sa lakim prilazom i parkingom u blizini.', 8);
  end if;
  if not exists (select 1 from public.gallery) then
    insert into public.gallery (title, image_url, sort_order) values
      ('Mesto za najlepše uspomene', '/images/flamingo-hero.jpg', 1),
      ('Igra bez granica', '/images/flamingo-playroom.jpg', 2),
      ('Torte sa potpisom', '/images/flamingo-cake.jpg', 3),
      ('Plešemo do poslednje pesme', '/images/flamingo-disco.jpg', 4);
  end if;
end;
$$;

-- The WebDev server uses its SUPABASE_SERVICE_ROLE_KEY for gallery upload,
-- replacement, and deletion. Never place that key in client-side code.
