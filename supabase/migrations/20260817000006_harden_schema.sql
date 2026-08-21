-- Keep the public catalog readable while restricting mutations to admins.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'produtos') then
    alter table public.produtos
      add column if not exists descricao_longa text;
  end if;
end
$$;

drop policy if exists "Permitir inserção/edição autenticada" on public.produtos;
drop policy if exists "Permitir leitura pública" on public.produtos;
drop policy if exists "products public read" on public.produtos;
drop policy if exists "products admin write" on public.produtos;

create policy "products public read"
  on public.produtos for select
  using (true);

create policy "products admin write"
  on public.produtos for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "anuncios authenticated write" on public.anuncios;
drop policy if exists "anuncios admin write" on public.anuncios;
create policy "anuncios admin write"
  on public.anuncios for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Resolve a username without exposing the profiles table to anonymous reads.
create or replace function public.get_login_email(identifier text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.email
  from public.profiles p
  where p.usuario is not null
    and lower(p.usuario) = lower(btrim(identifier))
  limit 1;
$$;

revoke all on function public.get_login_email(text) from public;
grant execute on function public.get_login_email(text) to anon, authenticated;

-- Users can edit their own profile data, but never privilege or identity fields.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = old.id and not public.is_admin() then
    new.role := old.role;
    new.email := old.email;
    new.usuario := old.usuario;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute procedure public.protect_profile_fields();

drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
create policy "profiles admin update"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.pedidos
  drop constraint if exists pedidos_status_check,
  drop constraint if exists pedidos_pagamento_check;

alter table public.pedidos
  add constraint pedidos_status_check
    check (status in ('pendente', 'pago', 'processando', 'enviado', 'entregue', 'cancelado')),
  add constraint pedidos_pagamento_check
    check (pagamento in ('card', 'pix', 'boleto'));

create or replace function public.validate_order_totals()
returns trigger
language plpgsql
as $$
begin
  if new.subtotal < 0 or new.frete < 0 or new.total < 0
     or abs(new.total - (new.subtotal + new.frete)) > 0.01 then
    raise exception 'Totais do pedido invalidos';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_order_totals on public.pedidos;
create trigger validate_order_totals
  before insert or update on public.pedidos
  for each row execute procedure public.validate_order_totals();

-- Storage stays public for delivery, but writes require an authenticated admin.
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do update set public = true;

drop policy if exists "produtos anon insert" on storage.objects;
drop policy if exists "produtos anon update" on storage.objects;
drop policy if exists "produtos anon delete" on storage.objects;
drop policy if exists "produtos admin insert" on storage.objects;
drop policy if exists "produtos admin update" on storage.objects;
drop policy if exists "produtos admin delete" on storage.objects;
create policy "produtos admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and public.is_admin());
create policy "produtos admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and public.is_admin())
  with check (bucket_id = 'produtos' and public.is_admin());
create policy "produtos admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and public.is_admin());

-- Backfill the profile identity fields for accounts created before the trigger fix.
update public.profiles p
set email = coalesce(u.email, p.email),
    usuario = coalesce(p.usuario, nullif(lower(u.raw_user_meta_data->>'usuario'), ''))
from auth.users u
where u.id = p.id;
