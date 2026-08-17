-- Políticas RLS do Storage para o bucket "produtos"
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor > New query > Run)
-- O bucket "produtos" é público apenas para leitura. Escrita exige usuário admin.

begin;

-- Remove políticas antigas (idempotente)
drop policy if exists "produtos public read" on storage.objects;
drop policy if exists "produtos anon insert" on storage.objects;
drop policy if exists "produtos anon update" on storage.objects;
drop policy if exists "produtos anon delete" on storage.objects;
drop policy if exists "produtos admin insert" on storage.objects;
drop policy if exists "produtos admin update" on storage.objects;
drop policy if exists "produtos admin delete" on storage.objects;

-- Leitura pública dos objetos do bucket (redundante em bucket público, mas explícito)
create policy "produtos public read"
  on storage.objects for select
  using (bucket_id = 'produtos');

create policy "produtos admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'produtos' and public.is_admin());

create policy "produtos admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'produtos' and public.is_admin())
  with check (bucket_id = 'produtos' and public.is_admin());

create policy "produtos admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'produtos' and public.is_admin());

commit;
