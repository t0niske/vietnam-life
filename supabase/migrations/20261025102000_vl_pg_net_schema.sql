-- pg_net cannot be relocated, so it is recreated in the extensions schema (its functions stay in "net")
drop extension if exists pg_net;
create extension pg_net schema extensions;
