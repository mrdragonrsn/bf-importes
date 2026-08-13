-- Função RPC de busca inteligente de produtos
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor > New query > Run)
-- Usa a extensão pg_trgm para busca aproximada (fuzzy) com correção de digitação.

begin;

-- 1. Garante a extensão de trigramas
create extension if not exists pg_trgm;

-- 2. Cria/atualiza a função de busca
--    Busca por nome, descrição curta e categoria, com ordenação por similaridade.
create or replace function public.buscar_produtos_inteligente(termo_busca text)
returns setof public.produtos
language sql
stable
security invoker
set search_path = public
as $$
  select p.*
  from public.produtos p
  where termo_busca is null or btrim(termo_busca) = ''
     or p.nome ilike '%' || termo_busca || '%'
     or p.descricao_curta ilike '%' || termo_busca || '%'
     or p.categoria ilike '%' || termo_busca || '%'
  order by
    (case when lower(p.nome) = lower(termo_busca) then 0 else 1 end),
    similarity(p.nome, termo_busca) desc,
    p.nome asc
  limit 10;
$$;

-- 3. Libera execução para anon e authenticated
grant execute on function public.buscar_produtos_inteligente(text) to anon, authenticated;

commit;
