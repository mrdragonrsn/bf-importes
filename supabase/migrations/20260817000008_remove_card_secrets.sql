-- Existing profiles in this project had no saved cards in the audit backup.
-- Clear any legacy PAN/CVV payload before the frontend switches to last-four only.
update public.profiles
set cartoes = '[]'::jsonb,
    updated_at = now()
where cartoes <> '[]'::jsonb;
