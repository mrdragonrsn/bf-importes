-- Create table to store contact form messages
create table if not exists public.contato_mensagens (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text not null,
    mensagem text not null,
    lida boolean not null default false,
    respondida boolean not null default false,
    resposta text,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.contato_mensagens enable row level security;

-- Policy: anyone can insert messages (for the contact form)
create policy "contato_mensagens public insert"
  on public.contato_mensagens for insert
  with check (true);

-- Policy: admin can read, update, delete
create policy "contato_mensagens admin write"
  on public.contato_mensagens for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Create index for faster queries
create index if not exists contato_mensagens_created_at_idx
  on public.contato_mensagens (created_at desc);

-- Function to mark message as read
create or replace function public.marcar_mensagem_lida(msg_id uuid)
returns void as $$
  update public.contato_mensagens set lida = true where id = msg_id;
$$ language sql security definer;

-- Function to respond to a message
create or replace function public.responder_mensagem(msg_id uuid, texto_resposta text)
returns void as $$
  update public.contato_mensagens
  set resposta = texto_resposta, respondida = true, lida = true
  where id = msg_id;
$$ language sql security definer;
