create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  preco numeric,
  estoque integer not null default 0,
  descricao_curta text,
  descricao_longa text,
  imagem_url text,
  imagens jsonb,
  created_at timestamptz not null default now()
);

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

create unique index if not exists anuncios_tipo_ordem_idx on public.anuncios (tipo, ordem);

create extension if not exists pg_trgm;

create or replace function public.buscar_produtos_inteligente(termo_busca text)
returns setof public.produtos
language sql
stable
set search_path = public
as $$
  select p.*
  from public.produtos p
  where termo_busca is null or btrim(termo_busca) = ''
     or p.nome ilike '%' || termo_busca || '%'
     or p.descricao_curta ilike '%' || termo_busca || '%'
     or p.categoria ilike '%' || termo_busca || '%'
  order by
    case when lower(p.nome) = lower(termo_busca) then 0 else 1 end,
    similarity(p.nome, termo_busca) desc,
    p.nome asc
  limit 10;
$$;

grant execute on function public.buscar_produtos_inteligente(text) to anon, authenticated;

alter table public.produtos enable row level security;
alter table public.anuncios enable row level security;

insert into public.produtos (id, nome, categoria, preco, estoque, descricao_curta, descricao_longa, imagem_url)
values
  ('348c91ac-76c3-40d4-bfb2-ed06633aa915', 'Brother DCP-L5652DN', 'multifuncionais', 3299, 6, 'Laser monocromática, duplex, scanner ADF, rede.', 'Multifuncional para escritórios que precisam de velocidade, rede e baixo custo por página.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/348c91ac.webp'),
  ('7ac16196-c3e1-40ff-a9b7-1c0db8baf5f5', 'Elgin i9', 'impressoras', 479, 40, 'Impressora de cupom não fiscal, 250 mm/s, USB. Ideal para PDV.', 'Impressora térmica compacta para pontos de venda e operações comerciais.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/7ac16196.webp'),
  ('3431e621-4e26-400a-aaa3-478ebf1536f5', 'Epson EcoTank L3250', 'multifuncionais', 1149, 25, 'Tanque de tinta colorida, Wi-Fi, baixo custo por página.', 'Multifuncional econômica para casa e pequenos negócios, com conectividade sem fio.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/3431e621.webp'),
  ('76a05b36-575b-4196-a567-6a60014b4bb5', 'HP LaserJet Pro M404dn', 'impressoras', 2199, 12, 'Monocromática, duplex automático, 40 ppm. Ideal para escritórios.', 'Impressora corporativa com impressão frente e verso e alta produtividade.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/76a05b36.webp'),
  ('0e38287c-ecb6-46bf-9487-28b0196a7f24', 'Kit Fusor HP LaserJet', 'pecas', 349, 8, 'Compatível com M402/M404/M426. Alta durabilidade.', 'Peça de reposição para manter a qualidade e a estabilidade da impressão.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/0e38287c.webp'),
  ('80a8edaa-e6e2-4d1a-99b4-70c7227142c2', 'Kit Manutenção Brother DR-2355', 'suprimentos', 259, 22, 'Cilindro de imagem para DCP/L2350. 12.000 páginas.', 'Kit de manutenção para impressoras Brother compatíveis.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/80a8edaa.webp'),
  ('d534aa38-54c0-4907-b2ee-82503f0b36a0', 'Placa Lógica Principal Epson', 'pecas', 289, 15, 'Controladora compatível com impressoras Epson. Revisada.', 'Placa revisada para reposição em equipamentos Epson compatíveis.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/d534aa38.webp'),
  ('a809c04b-18eb-4c87-aee4-c64a8942ff4e', 'Toner HP 58A Original', 'suprimentos', 419, 30, 'Cartucho toner preto CF258A. Até 3.000 páginas.', 'Toner original para impressões consistentes e rendimento confiável.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/a809c04b.webp'),
  ('c1b87444-263e-4840-bbbe-264bac46ac97', 'Zebra ZD421', 'impressoras', 2799, 10, 'Etiquetas térmicas, 203 dpi, USB/Ethernet. Logística.', 'Impressora térmica para etiquetas e rotinas de logística.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/c1b87444.webp'),
  ('21b6628f-6370-4b92-9a25-331e021b144b', 'Scanner HP ScanJet Pro 2500', 'multifuncionais', 1850, 7, 'Scanner duplex de mesa, 40 ppm, USB 3.0.', 'Scanner duplex para digitalização organizada em ambientes profissionais.', 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/21b6628f.webp')
on conflict (id) do update set
  descricao_longa = coalesce(nullif(public.produtos.descricao_longa, ''), excluded.descricao_longa);
