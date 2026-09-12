-- =====================================================================
-- Ampliación de la tabla `vehiculos` para soportar el CRUD completo
-- Ejecutar en Supabase → SQL Editor → New query, DESPUÉS de haber
-- corrido supabase_parqueadero_uteq.sql (práctica anterior).
-- =====================================================================

-- 1) Columna con la cédula completa (texto plano). Es la que el
--    formulario de "Agregar" y "Editar" escribe. Nunca se selecciona
--    desde el cliente: la app solo lee `cedula_enmascarada`.
alter table public.vehiculos
  add column if not exists cedula text;

-- 2) Columna generada que enmascara la cédula automáticamente.
--    Si ya existía en la práctica anterior como columna generada a
--    partir de otro campo, omita este bloque o ajústelo a su esquema.
alter table public.vehiculos
  drop column if exists cedula_enmascarada;

alter table public.vehiculos
  add column cedula_enmascarada text generated always as (
    case
      when cedula is null or length(cedula) < 5 then cedula
      else left(cedula, 3) || repeat('*', length(cedula) - 5) || right(cedula, 2)
    end
  ) stored;

-- 3) Habilitar RLS (si no estaba habilitado).
alter table public.vehiculos enable row level security;

-- 4) Políticas de acceso.
--    La práctica no incluye autenticación de usuarios, por lo que las
--    políticas se dejan abiertas para el rol anónimo (clave pública)
--    únicamente con fines académicos. En un entorno productivo estas
--    operaciones deben restringirse con Supabase Auth y políticas por
--    usuario/rol.

drop policy if exists "vehiculos_select_publico" on public.vehiculos;
create policy "vehiculos_select_publico"
  on public.vehiculos for select
  to anon, authenticated
  using (true);

drop policy if exists "vehiculos_insert_publico" on public.vehiculos;
create policy "vehiculos_insert_publico"
  on public.vehiculos for insert
  to anon, authenticated
  with check (true);

drop policy if exists "vehiculos_update_publico" on public.vehiculos;
create policy "vehiculos_update_publico"
  on public.vehiculos for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "vehiculos_delete_publico" on public.vehiculos;
create policy "vehiculos_delete_publico"
  on public.vehiculos for delete
  to anon, authenticated
  using (true);

-- 5) Verificación rápida.
select count(*) as total_vehiculos from public.vehiculos;
