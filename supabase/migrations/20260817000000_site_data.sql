create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  telefone text not null default '',
  foto_url text,
  endereco jsonb not null default '{}'::jsonb,
  cartoes jsonb not null default '[]'::jsonb,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem integer not null default 0,
  ativo boolean not null default true
);

create table if not exists public.site_settings (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.carrinhos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  itens jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  cliente jsonb not null default '{}'::jsonb,
  itens jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  frete numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  pagamento text not null default 'card',
  status text not null default 'pendente',
  data_entrega text not null default '',
  created_at timestamptz not null default now()
);

insert into public.categorias (nome, ordem)
values ('impressoras', 1), ('multifuncionais', 2), ('pecas', 3), ('suprimentos', 4)
on conflict (nome) do nothing;

insert into public.site_settings (chave, valor)
values
  ('banner', '{"title":"Impressoras, multifuncionais e peças","title2":"com garantia e procedência","subtitle":"Desde equipamentos e suprimentos até peças originais e genéricas.","bgUrl":"","bgColor":"linear-gradient(170deg, #0d2f5e 0%, #0a1f3f 100%)","btnText":"Ver Produtos"}'::jsonb),
  ('config', '{"company":"BIANCO & FERREIRA - COMERCIO DE EQUIPAMENTOS PARA INFORMATICA LTDA","brand":"B&F Importes","cnpj":"03.108.169/0001-58","phone":"(16) 98138-6747","email":"atendimento@biancoeferreira.com.br","hours":"Seg–Sex 8h às 18h | Sáb 8h às 13h","address":"R. Rui Barbosa, 363 — Centro, Jaboticabal — SP, 14870-090","cep":"14870-090","cityState":"Jaboticabal — SP"}'::jsonb)
on conflict (chave) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categorias enable row level security;
alter table public.site_settings enable row level security;
alter table public.carrinhos enable row level security;
alter table public.pedidos enable row level security;

drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles admin read" on public.profiles;
drop policy if exists "categories public read" on public.categorias;
drop policy if exists "categories admin write" on public.categorias;
drop policy if exists "settings public read" on public.site_settings;
drop policy if exists "settings admin write" on public.site_settings;
drop policy if exists "cart self access" on public.carrinhos;
drop policy if exists "orders self read" on public.pedidos;
drop policy if exists "orders self insert" on public.pedidos;
drop policy if exists "orders admin access" on public.pedidos;

create policy "profiles self read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin read" on public.profiles for select to authenticated using (public.is_admin());
create policy "categories public read" on public.categorias for select using (ativo = true);
create policy "categories admin write" on public.categorias for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings public read" on public.site_settings for select using (true);
create policy "settings admin write" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "cart self access" on public.carrinhos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "orders self read" on public.pedidos for select to authenticated using (user_id = auth.uid());
create policy "orders self insert" on public.pedidos for insert to authenticated with check (user_id = auth.uid());
create policy "orders admin access" on public.pedidos for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant execute on function public.is_admin() to authenticated;
