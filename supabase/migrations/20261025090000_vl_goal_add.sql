-- bot: add money saved towards a goal (a negative amount takes it back); returns the new saved amount in $
create or replace function public.vl_goal_add(p_id text, p_usd numeric)
returns numeric language plpgsql security definer set search_path = ''
as $$
declare v numeric;
begin
  update public.vl_sections
     set body = jsonb_set(body, '{items}', coalesce((
       select jsonb_agg(case when x ->> 'id' = p_id
         then jsonb_set(x, '{saved}', to_jsonb(greatest(0,
           case when x ->> 'saved' ~ '^-?[0-9]+(\.[0-9]+)?$' then (x ->> 'saved')::numeric else 0 end + p_usd)))
         else x end order by o)
       from jsonb_array_elements(body -> 'items') with ordinality t(x, o)), '[]'::jsonb)),
         updated_at = now()
   where sec = 'goals';
  select (x ->> 'saved')::numeric into v
    from public.vl_sections, jsonb_array_elements(body -> 'items') x
   where sec = 'goals' and x ->> 'id' = p_id;
  return v;
end;
$$;
revoke all on function public.vl_goal_add(text, numeric) from public, anon, authenticated;
grant execute on function public.vl_goal_add(text, numeric) to service_role;
