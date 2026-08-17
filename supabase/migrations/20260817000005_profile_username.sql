alter table public.profiles
  add column if not exists usuario text;

create unique index if not exists profiles_usuario_lower_unique
  on public.profiles (lower(usuario))
  where usuario is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome, usuario)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'nome', ''),
    nullif(lower(new.raw_user_meta_data->>'usuario'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        nome = case
          when excluded.nome <> '' then excluded.nome
          else public.profiles.nome
        end,
        usuario = coalesce(excluded.usuario, public.profiles.usuario);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
