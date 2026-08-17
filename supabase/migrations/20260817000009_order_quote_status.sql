alter table public.pedidos
  drop constraint if exists pedidos_pagamento_check;

alter table public.pedidos
  add constraint pedidos_pagamento_check
  check (pagamento in ('quote', 'card', 'pix', 'boleto'));
