do $$
begin
  if to_regclass('public.produtos') is not null then
    update public.produtos set imagem_url = 'https://trirxmcalxktampbujyr.supabase.co/storage/v1/object/public/produtos/webp/21b6628f.webp' where id = '21b6628f-6370-4b92-9a25-331e021b144b';
  end if;
end $$;
