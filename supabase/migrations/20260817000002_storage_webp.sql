update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/anuncio-principal.webp' where tipo = 'galeria' and ordem = 1;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/anuncio-localizacao.webp' where tipo = 'galeria' and ordem = 2;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/anuncio-recarga.webp' where tipo = 'galeria' and ordem = 3;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/anuncio-produtos.webp' where tipo = 'galeria' and ordem = 4;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/promos/promo1.webp' where tipo = 'promo' and ordem = 1;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/promos/promo2.webp' where tipo = 'promo' and ordem = 2;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/anuncio-principal.webp' where tipo = 'promo' and ordem = 3;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/promos/promo4.webp' where tipo = 'promo' and ordem = 4;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/promos/promo5.webp' where tipo = 'promo' and ordem = 5;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/promos/promo6.webp' where tipo = 'promo' and ordem = 6;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/promos/promo7.webp' where tipo = 'promo' and ordem = 7;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/promos/promo8.webp' where tipo = 'promo' and ordem = 8;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/promos/promo9.webp' where tipo = 'promo' and ordem = 9;
update public.anuncios set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/anuncios/promos/promo10.webp' where tipo = 'promo' and ordem = 10;

update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/348c91ac.webp' where id = '348c91ac-76c3-40d4-bfb2-ed06633aa915';
update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/7ac16196.webp' where id = '7ac16196-c3e1-40ff-a9b7-1c0db8baf5f5';
update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/3431e621.webp' where id = '3431e621-4e26-400a-aaa3-478ebf1536f5';
update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/76a05b36.webp' where id = '76a05b36-575b-4196-a567-6a60014b4bb5';
update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/0e38287c.webp' where id = '0e38287c-ecb6-46bf-9487-28b0196a7f24';
update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/80a8edaa.webp' where id = '80a8edaa-e6e2-4d1a-99b4-70c7227142c2';
update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/d534aa38.webp' where id = 'd534aa38-54c0-4907-b2ee-82503f0b36a0';
update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/21b6628f.webp' where id = '21b6628f-6370-4b92-9a25-331e021b144b';
update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/a809c04b.webp' where id = 'a809c04b-18eb-4c87-aee4-c64a8942ff4e';
update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/c1b87444.webp' where id = 'c1b87444-263e-4840-bbbe-264bac46ac97';

insert into storage.buckets (id, name, public)
values ('perfis', 'perfis', true)
on conflict (id) do update set public = true;

drop policy if exists "perfis public read" on storage.objects;
drop policy if exists "perfis owner write" on storage.objects;
create policy "perfis public read" on storage.objects for select using (bucket_id = 'perfis');
create policy "perfis owner write" on storage.objects for all to authenticated using (bucket_id = 'perfis' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'perfis' and (storage.foldername(name))[1] = auth.uid()::text);
