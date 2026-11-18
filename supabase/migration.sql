-- Ya aplicada al proyecto "regear-albion" (migración: stock_dashboard_min_topused_move).
-- Se guarda aquí solo como referencia / para recrearla en otro proyecto.
-- Requiere el esquema existente: guilds, guild_members, stock, movements, is_member(), can_edit(), stock_apply().

create table if not exists public.stock_min (
  guild_id   uuid not null references public.guilds(id) on delete cascade,
  item_id    text not null check (item_id ~ '^T[0-9]_[A-Za-z0-9_]+(@[0-9])?$'),
  min_qty    integer not null check (min_qty >= 0 and min_qty <= 99999),
  updated_at timestamptz not null default now(),
  primary key (guild_id, item_id)
);
alter table public.stock_min enable row level security;
create policy stock_min_select on public.stock_min for select to authenticated using ((select public.is_member(guild_id)));
create policy stock_min_insert on public.stock_min for insert to authenticated with check ((select public.can_edit(guild_id)));
create policy stock_min_update on public.stock_min for update to authenticated using ((select public.can_edit(guild_id))) with check ((select public.can_edit(guild_id)));
create policy stock_min_delete on public.stock_min for delete to authenticated using ((select public.can_edit(guild_id)));
create index if not exists movements_guild_created_idx on public.movements (guild_id, created_at desc);

-- stock_move(p_guild, p_item, p_place, p_type in/out/adjust, p_qty): atómico, usa stock_apply y registra en movements
-- top_used(p_guild, p_days, p_limit): suma de salidas (movements.qty < 0) por item
-- (definiciones completas en la migración aplicada; ver Supabase → Database → Migrations)
