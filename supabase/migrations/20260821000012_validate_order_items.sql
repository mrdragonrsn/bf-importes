-- Validate that the order subtotal matches the sum of its line items.
-- The frontend sends item prices as formatted strings ("R$ 3.299,00"), so we
-- parse them server-side and recompute the subtotal, ignoring any value the
-- client sends for subtotal consistency. This closes the hole where a client
-- could insert an order with a manipulated subtotal/total.

create or replace function public.parse_brl(value text)
returns numeric
language sql
immutable
as $$
  select case
    when value is null or btrim(value) = '' then 0::numeric
    else coalesce(
      (regexp_replace(regexp_replace(value, '[^0-9,]', '', 'g'), ',', '.'))::numeric,
      0::numeric
    )
  end;
$$;

create or replace function public.validate_order_items()
returns trigger
language plpgsql
as $$
declare
  item jsonb;
  computed numeric(12,2) := 0;
  qty int;
begin
  if new.itens is not null and jsonb_typeof(new.itens) = 'array' then
    for item in select * from jsonb_array_elements(new.itens) loop
      qty := coalesce((item->>'qtd')::int, 1);
      if qty < 1 then
        raise exception 'Quantidade de item invalida';
      end if;
      computed := computed + (public.parse_brl(item->>'preco') * qty);
    end loop;
  end if;

  if abs(computed - coalesce(new.subtotal, 0)) > 0.01 then
    raise exception 'Subtotal do pedido nao confere com os itens';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_order_items on public.pedidos;
create trigger validate_order_items
  before insert or update on public.pedidos
  for each row execute procedure public.validate_order_items();
