-- MacroVidrios Cut - Esquema inicial
-- Convenciones: medidas en mm enteros, dinero en centavos enteros.

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'supervisor', 'vendedor', 'cortador')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null,
  identification_number text,
  phone text,
  whatsapp text,
  email text,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.glass_colors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  code text not null,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.glass_thicknesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  thickness_mm integer not null check (thickness_mm > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, thickness_mm)
);

create table if not exists public.glass_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  color_id uuid not null references public.glass_colors (id),
  thickness_id uuid not null references public.glass_thicknesses (id),
  internal_code text not null,
  name text not null,
  default_kerf_mm integer check (default_kerf_mm >= 0),
  default_margin_mm integer check (default_margin_mm >= 0),
  default_separation_mm integer check (default_separation_mm >= 0),
  default_edge_margin_mm integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, internal_code)
);

create table if not exists public.sheet_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  width_mm integer not null check (width_mm > 0),
  height_mm integer not null check (height_mm > 0),
  default_cost_cents bigint not null default 0 check (default_cost_cents >= 0),
  minimum_usable_area_mm2 bigint,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_sheets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sheet_type_id uuid not null references public.sheet_types (id),
  glass_product_id uuid not null references public.glass_products (id),
  quantity integer not null default 0 check (quantity >= 0),
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  status text not null default 'available' check (status in ('available', 'reserved', 'depleted', 'discarded')),
  location text,
  batch_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remnants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  glass_product_id uuid not null references public.glass_products (id),
  width_mm integer not null check (width_mm > 0),
  height_mm integer not null check (height_mm > 0),
  shape_type text not null default 'rectangle' check (shape_type in ('rectangle')),
  geometry_json jsonb,
  quantity integer not null default 1 check (quantity >= 0),
  minimum_usable_flag boolean not null default true,
  status text not null default 'available' check (status in ('available', 'reserved', 'consumed', 'discarded')),
  source_cutting_job_id uuid,
  source_layout_id uuid,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  order_number text not null,
  customer_id uuid references public.customers (id),
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'queued', 'in_progress', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  due_at timestamptz,
  reference text,
  notes text,
  subtotal_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  total_cents bigint not null default 0,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (organization_id, order_number)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  glass_product_id uuid not null references public.glass_products (id),
  name text,
  piece_type text not null default 'rectangle' check (piece_type in ('rectangle')),
  quantity integer not null check (quantity > 0),
  width_mm integer not null check (width_mm > 0),
  height_mm integer not null check (height_mm > 0),
  rotatable boolean not null default true,
  geometry_json jsonb,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'cut', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pieces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  sequence_number integer not null,
  piece_code text not null,
  quantity_index integer not null default 0,
  geometry_type text not null default 'rectangle' check (geometry_type in ('rectangle')),
  geometry_json jsonb not null default '{}'::jsonb,
  requested_width_mm integer not null check (requested_width_mm > 0),
  requested_height_mm integer not null check (requested_height_mm > 0),
  area_mm2 bigint not null check (area_mm2 > 0),
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'cut', 'cancelled')),
  cutting_job_id uuid,
  cutting_operation_id uuid,
  cut_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, piece_code)
);

create table if not exists public.cutting_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'optimizing', 'optimized', 'ready', 'in_progress', 'completed', 'cancelled')),
  material_strategy text not null check (material_strategy in ('sheets', 'remnants', 'mixed')),
  optimizer_version text not null,
  configuration_version text not null,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  total_sheet_area_mm2 bigint not null default 0,
  total_used_area_mm2 bigint not null default 0,
  total_waste_area_mm2 bigint not null default 0,
  utilization_percent numeric(6, 2) not null default 0,
  waste_percent numeric(6, 2) not null default 0,
  total_material_cost_cents bigint not null default 0,
  total_cutting_cost_cents bigint not null default 0,
  total_job_cost_cents bigint not null default 0,
  notes text,
  created_by uuid not null references public.profiles (id),
  completed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (organization_id, job_number)
);

create table if not exists public.cutting_job_orders (
  cutting_job_id uuid not null references public.cutting_jobs (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cutting_job_id, order_id)
);

create table if not exists public.cutting_layouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  cutting_job_id uuid not null references public.cutting_jobs (id) on delete cascade,
  sequence_number integer not null,
  material_type text not null check (material_type in ('sheet', 'remnant')),
  source_id text not null,
  source_instance_id text not null,
  inventory_sheet_id uuid references public.inventory_sheets (id),
  remnant_id uuid references public.remnants (id),
  width_mm integer not null check (width_mm > 0),
  height_mm integer not null check (height_mm > 0),
  utilization_percent numeric(6, 2) not null default 0,
  waste_percent numeric(6, 2) not null default 0,
  geometry_json jsonb not null default '{}'::jsonb,
  score numeric(8, 2) not null default 0,
  is_selected boolean not null default false,
  optimizer_version text not null,
  configuration_version text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cutting_areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  cutting_layout_id uuid not null references public.cutting_layouts (id) on delete cascade,
  parent_area_id uuid references public.cutting_areas (id),
  sequence_number integer not null default 0,
  x_mm integer not null,
  y_mm integer not null,
  width_mm integer not null,
  height_mm integer not null,
  geometry_json jsonb,
  area_type text not null check (area_type in ('source', 'piece', 'waste')),
  created_at timestamptz not null default now()
);

create table if not exists public.cutting_operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  cutting_job_id uuid not null references public.cutting_jobs (id) on delete cascade,
  cutting_layout_id uuid not null references public.cutting_layouts (id) on delete cascade,
  sequence_number integer not null,
  operation_type text not null default 'cut' check (operation_type in ('cut')),
  target_area_id uuid references public.cutting_areas (id),
  target_piece_id uuid references public.pieces (id),
  axis text check (axis in ('x', 'y')),
  position_mm integer,
  cut_length_mm integer,
  instruction text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'skipped', 'issue')),
  completed_at timestamptz,
  completed_by uuid references public.profiles (id)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  glass_product_id uuid not null references public.glass_products (id),
  inventory_sheet_id uuid references public.inventory_sheets (id),
  remnant_id uuid references public.remnants (id),
  movement_type text not null
    check (movement_type in ('entry', 'reservation', 'consumption', 'release', 'adjustment', 'discard')),
  quantity integer not null,
  unit_cost_cents bigint,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.material_reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  remnant_id uuid not null references public.remnants (id) on delete cascade,
  cutting_job_id uuid not null references public.cutting_jobs (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'consumed', 'released', 'expired')),
  quantity integer not null default 1 check (quantity > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  rule_type text not null
    check (rule_type in ('per_piece', 'per_linear_meter', 'per_square_meter', 'per_cut', 'fixed', 'formula')),
  parameter_json jsonb not null default '{}'::jsonb,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.additional_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  unit_type text not null
    check (unit_type in ('per_piece', 'per_square_meter', 'per_linear_meter', 'per_cut', 'fixed')),
  unit_price_cents bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  previous_data_json jsonb,
  new_data_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_remnants_lookup
  on public.remnants (organization_id, glass_product_id, status, width_mm, height_mm);
create index if not exists idx_orders_queue on public.orders (organization_id, status, created_at desc);
create index if not exists idx_pieces_order on public.pieces (order_id);
create index if not exists idx_pieces_job on public.pieces (cutting_job_id);
create index if not exists idx_operations_job on public.cutting_operations (cutting_job_id, sequence_number);
create index if not exists idx_movements_product on public.inventory_movements (organization_id, glass_product_id, created_at desc);
create index if not exists idx_reservations_active on public.material_reservations (cutting_job_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'customers', 'glass_colors', 'glass_thicknesses', 'glass_products',
    'sheet_types', 'inventory_sheets', 'remnants', 'orders', 'order_items',
    'pricing_rules', 'additional_services', 'material_reservations'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      table_name, table_name
    );
  end loop;
end;
$$;

-- RLS
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.glass_colors enable row level security;
alter table public.glass_thicknesses enable row level security;
alter table public.glass_products enable row level security;
alter table public.sheet_types enable row level security;
alter table public.inventory_sheets enable row level security;
alter table public.remnants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.pieces enable row level security;
alter table public.cutting_jobs enable row level security;
alter table public.cutting_job_orders enable row level security;
alter table public.cutting_layouts enable row level security;
alter table public.cutting_areas enable row level security;
alter table public.cutting_operations enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.material_reservations enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.additional_services enable row level security;
alter table public.audit_logs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'customers', 'glass_colors', 'glass_thicknesses', 'glass_products', 'sheet_types',
    'inventory_sheets', 'remnants', 'orders', 'order_items', 'pieces', 'cutting_jobs',
    'cutting_layouts', 'cutting_areas', 'cutting_operations', 'inventory_movements',
    'material_reservations', 'pricing_rules', 'additional_services', 'audit_logs'
  ]
  loop
    execute format('drop policy if exists org_isolation on public.%I;', table_name);
    execute format(
      'create policy org_isolation on public.%I using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());',
      table_name
    );
  end loop;
end;
$$;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  using (id = auth.uid() or organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists org_member on public.organizations;
create policy org_member on public.organizations
  using (id = public.current_org_id());

drop policy if exists job_orders_isolation on public.cutting_job_orders;
create policy job_orders_isolation on public.cutting_job_orders
  using (
    exists (
      select 1 from public.cutting_jobs j
      where j.id = cutting_job_id and j.organization_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.cutting_jobs j
      where j.id = cutting_job_id and j.organization_id = public.current_org_id()
    )
  );
