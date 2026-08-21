-- Tighten message RPCs further: revoke EXECUTE from the anon role explicitly.
-- Supabase grants EXECUTE to anon/authenticated by default on public functions,
-- so revoking from PUBLIC alone was not enough to block the anonymous role.

revoke execute on function public.marcar_mensagem_lida(uuid) from anon;
revoke execute on function public.responder_mensagem(uuid, text) from anon;

grant execute on function public.marcar_mensagem_lida(uuid) to authenticated;
grant execute on function public.responder_mensagem(uuid, text) to authenticated;
