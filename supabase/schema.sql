-- ═══════════════════════════════════════════════════════════════════════════
-- Bitácora · esquema de sincronización
-- Pégalo completo en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
--
-- Una sola tabla guarda todos tus registros (notas, tareas, proyectos…) como JSON.
-- Row Level Security garantiza que cada usuario solo ve y modifica lo suyo.
-- ═══════════════════════════════════════════════════════════════════════════

create sequence if not exists public.records_rev_seq;

create table if not exists public.records (
  user_id    uuid   not null default auth.uid() references auth.users (id) on delete cascade,
  tbl        text   not null,              -- entries, projects, tasks…
  id         text   not null,              -- id del registro en el dispositivo
  data       jsonb  not null,              -- el registro completo
  updated_at bigint not null,              -- reloj del cambio (last-write-wins)
  deleted_at bigint,                       -- borrado lógico
  rev        bigint not null default nextval('public.records_rev_seq'), -- orden de llegada al servidor
  primary key (user_id, tbl, id)
);

create index if not exists records_user_rev on public.records (user_id, rev);

alter table public.records enable row level security;

drop policy if exists "records_owner" on public.records;
create policy "records_owner" on public.records
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.records to authenticated;
grant usage, select on sequence public.records_rev_seq to authenticated;

-- Subida en lote con "gana el cambio más reciente": nunca pisa una versión más nueva.
create or replace function public.push_records(rows jsonb)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.records (user_id, tbl, id, data, updated_at, deleted_at)
  select auth.uid(), r->>'tbl', r->>'id', r->'data', (r->>'updated_at')::bigint, (r->>'deleted_at')::bigint
  from jsonb_array_elements(rows) as r
  on conflict (user_id, tbl, id) do update
    set data       = excluded.data,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        rev        = nextval('public.records_rev_seq')
    where public.records.updated_at < excluded.updated_at;
$$;

grant execute on function public.push_records(jsonb) to authenticated;

-- Tiempo real: el otro dispositivo se entera al instante de los cambios.
do $$
begin
  alter publication supabase_realtime add table public.records;
exception when duplicate_object then null;
end $$;

-- ─── Archivos adjuntos (bucket privado, una carpeta por usuario) ───────────
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments_select" on storage.objects;
drop policy if exists "attachments_insert" on storage.objects;
drop policy if exists "attachments_update" on storage.objects;
drop policy if exists "attachments_delete" on storage.objects;

create policy "attachments_select" on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attachments_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attachments_update" on storage.objects for update to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attachments_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
