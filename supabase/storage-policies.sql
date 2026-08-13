-- Políticas RLS do Storage para o bucket "produtos"
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor > New query > Run)
-- O bucket "produtos" já foi criado como público. Este script libera upload/remoção
-- via anon key (necessário porque o painel admin atual não usa Supabase Auth).

begin;

-- Remove políticas antigas (idempotente)
drop policy if exists "produtos public read" on storage.objects;
drop policy if exists "produtos anon insert" on storage.objects;
drop policy if exists "produtos anon update" on storage.objects;
drop policy if exists "produtos anon delete" on storage.objects;

-- Leitura pública dos objetos do bucket (redundante em bucket público, mas explícito)
create policy "produtos public read"
  on storage.objects for select
  using (bucket_id = 'produtos');

-- Upload anônimo no bucket produtos (caminho deve começar com "produtos/")
create policy "produtos anon insert"
  on storage.objects for insert
  with check (bucket_id = 'produtos');

-- Atualização anônima (troca de imagem via upsert)
create policy "produtos anon update"
  on storage.objects for update
  using (bucket_id = 'produtos');

-- Remoção anônima (apagar imagem ao excluir produto)
create policy "produtos anon delete"
  on storage.objects for delete
  using (bucket_id = 'produtos');

commit;
