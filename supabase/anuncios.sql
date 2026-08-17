create table if not exists public.anuncios (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('galeria', 'promo')),
  nome text not null,
  tag text,
  titulo text,
  descricao text,
  link text,
  imagem_url text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.anuncios enable row level security;

create unique index if not exists anuncios_tipo_ordem_idx on public.anuncios (tipo, ordem);

drop policy if exists "anuncios public read" on public.anuncios;
drop policy if exists "anuncios authenticated write" on public.anuncios;

create policy "anuncios public read"
  on public.anuncios for select
  using (ativo = true);

create policy "anuncios authenticated write"
  on public.anuncios for all to authenticated
  using (true) with check (true);

insert into public.anuncios (tipo, nome, tag, titulo, descricao, link, imagem_url, ordem)
values
  ('galeria', 'Anúncio principal', null, null, null, null, '/assets/images/Anuncio.jpeg', 1),
  ('galeria', 'Anúncio de localização', null, null, null, null, '/assets/images/Anuncio2.jpg', 2),
  ('galeria', 'Anúncio de recarga', null, null, null, null, '/assets/images/Anuncio 3.jpg', 3),
  ('galeria', 'Anúncio de produtos', null, null, null, null, '/assets/images/anuncio4.jpg', 4),
  ('promo', 'Locação comercial', 'Locação Comercial', 'Economize com locação de impressoras', 'Solução ideal para empresas imprimirem sem custos extras com compra de equipamentos.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/promos/promo1.jpg', 1),
  ('promo', 'Suprimentos', 'Suprimentos', 'Sua impressora pronta para a semana', 'Inicie a semana com estoque de tintas e cartuchos renovados.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/promos/promo2.jpg', 2),
  ('promo', 'Assistência técnica', 'Assistência Técnica', 'Luz Vermelha Piscando?', 'Se a sua impressora apresentou falha ou luz de alerta, chame nossa assistência especializada.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/Anuncio.jpeg', 3),
  ('promo', 'Planos corporativos', 'Planos Corporativos', 'Planos de locação sem custo inicial', 'Equipamentos modernos com manutenção inclusa e flexibilidade para o seu negócio.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/promos/promo4.jpg', 4),
  ('promo', 'Loja física', 'Loja Física', 'Recarga rápida de cartuchos', 'Traga seu cartucho até nossa loja física para recarga rápida com valor especial.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/promos/promo5.jpg', 5),
  ('promo', 'Solução rápida', 'Solução Rápida', 'Papel em branco? A gente resolve', 'Conte com a nossa assistência para voltar a imprimir.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/promos/promo6.jpg', 6),
  ('promo', 'Atendimento', 'Atendimento', 'Produtos com a melhor qualidade', 'Oferecemos qualidade e atendimento para nossos clientes.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/promos/promo7.jpg', 7),
  ('promo', 'Rotina', 'Rotina', 'Hora de voltar aos trabalhos', 'Garanta os suprimentos necessários para manter a produtividade em dia.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/promos/promo8.jpg', 8),
  ('promo', 'Referência', 'Referência', 'Referência em impressoras e cartuchos', 'Conheça nossos produtos e serviços.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/promos/promo9.jpg', 9),
  ('promo', 'Guia de compra', 'Guia de Compra', 'Pensando em comprar uma impressora nova?', 'Confira as dicas para ajudar na decisão de compra.', 'https://www.facebook.com/bfjaboticabal', '/assets/images/promos/promo10.jpg', 10)
on conflict (tipo, ordem) do update set
  nome = excluded.nome,
  tag = excluded.tag,
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  link = excluded.link,
  imagem_url = excluded.imagem_url,
  ativo = true;

insert into storage.buckets (id, name, public)
values ('anuncios', 'anuncios', true)
on conflict (id) do update set public = true;

drop policy if exists "anuncios storage public read" on storage.objects;
drop policy if exists "anuncios storage authenticated write" on storage.objects;

create policy "anuncios storage public read"
  on storage.objects for select
  using (bucket_id = 'anuncios');

create policy "anuncios storage authenticated write"
  on storage.objects for all to authenticated
  using (bucket_id = 'anuncios') with check (bucket_id = 'anuncios');
