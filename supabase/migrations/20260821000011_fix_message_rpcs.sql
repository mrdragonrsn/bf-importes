-- Security fix: restrict message RPCs to admins.
-- Previously these functions ran as security definer without checking is_admin(),
-- so any caller (including anon) could mark messages read or write a reply.

create or replace function public.marcar_mensagem_lida(msg_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.contato_mensagens set lida = true
  where id = msg_id and public.is_admin();
$$;

create or replace function public.responder_mensagem(msg_id uuid, texto_resposta text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.contato_mensagens
  set resposta = texto_resposta, respondida = true, lida = true
  where id = msg_id and public.is_admin();
$$;

revoke all on function public.marcar_mensagem_lida(uuid) from public;
revoke all on function public.responder_mensagem(uuid, text) from public;
grant execute on function public.marcar_mensagem_lida(uuid) to authenticated;
grant execute on function public.responder_mensagem(uuid, text) to authenticated;
