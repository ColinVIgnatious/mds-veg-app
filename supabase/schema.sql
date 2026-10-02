-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run against a fresh project; if you already ran an older version
-- of this file, drop the old tables first (see bottom of file).

create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ml text,
  name_hi text,
  category text not null default 'vegetable' check (category in ('vegetable', 'fruit', 'other')),
  unit text not null default 'kg',
  wholesale_price numeric(10, 2) not null default 0,
  retail_price numeric(10, 2) not null default 0,
  stock numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  rate_type text not null default 'retail' check (rate_type in ('wholesale', 'retail')),
  total numeric(10, 2) not null default 0,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_name_ml text,
  product_name_hi text,
  unit_price numeric(10, 2) not null,
  quantity numeric(10, 2) not null,
  line_total numeric(10, 2) not null
);

create table if not exists stock_entries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  entry_date date not null default current_date,
  quantity numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- One row per staff account. Any authenticated user with no row here is
-- treated as an admin (keeps existing single-admin setups working
-- unchanged). To make someone a billing-only staff account, run:
--   insert into user_roles (user_id, role) values ('<user id from Authentication > Users>', 'staff');
create table if not exists user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- Safe to re-run: adds the new columns if you already created these tables
-- from an earlier version of this file.
alter table products add column if not exists name_ml text;
alter table products add column if not exists name_hi text;
alter table products add column if not exists category text not null default 'vegetable';
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_category_check'
  ) then
    alter table products add constraint products_category_check
      check (category in ('vegetable', 'fruit', 'other'));
  end if;
end $$;
alter table bill_items add column if not exists product_name_ml text;
alter table bill_items add column if not exists product_name_hi text;
alter table bills add column if not exists created_by uuid references auth.users(id) default auth.uid();

alter table products enable row level security;
alter table bills enable row level security;
alter table bill_items enable row level security;
alter table stock_entries enable row level security;
alter table user_roles enable row level security;

-- Returns true unless the current user has an explicit 'staff' row in
-- user_roles, so existing admin accounts keep working with no setup.
create or replace function is_admin() returns boolean
language sql stable as $$
  select coalesce(
    (select role from user_roles where user_id = auth.uid()) <> 'staff',
    true
  );
$$;

drop policy if exists "anon full access" on products;
drop policy if exists "anon full access" on bills;
drop policy if exists "anon full access" on bill_items;
drop policy if exists "authenticated full access" on products;
drop policy if exists "authenticated full access" on bills;
drop policy if exists "authenticated full access" on bill_items;
drop policy if exists "authenticated full access" on stock_entries;

-- user_roles: everyone can read only their own role row (needed so the
-- client can tell whether the signed-in user is staff or admin). No client
-- can insert/update/delete here — assign roles yourself via the SQL editor.
create policy "users read own role" on user_roles
  for select using (user_id = auth.uid());

-- products: any signed-in user can read (staff need prices/stock while
-- billing), but only admins can add, edit, or delete products.
create policy "authenticated can read products" on products
  for select using (auth.role() = 'authenticated');
create policy "admin can insert products" on products
  for insert with check (is_admin());
create policy "admin can update products" on products
  for update using (is_admin()) with check (is_admin());
create policy "admin can delete products" on products
  for delete using (is_admin());

-- stock_entries: admin only, in both directions. Staff never restock.
create policy "admin full access stock_entries" on stock_entries
  for all using (is_admin()) with check (is_admin());

-- bills: any signed-in user can create one (staff need this to bill).
-- Only admins can see the full list; staff can only see bills they made
-- themselves (e.g. to reprint the receipt right after saving it). Only
-- admins can edit/delete a bill after the fact.
create policy "authenticated can insert bills" on bills
  for insert with check (auth.role() = 'authenticated');
create policy "admin or owner can read bills" on bills
  for select using (is_admin() or created_by = auth.uid());
create policy "admin can update bills" on bills
  for update using (is_admin()) with check (is_admin());
create policy "admin can delete bills" on bills
  for delete using (is_admin());

-- bill_items: same visibility rule as their parent bill.
create policy "authenticated can insert bill_items" on bill_items
  for insert with check (auth.role() = 'authenticated');
create policy "admin or owner can read bill_items" on bill_items
  for select using (
    exists (
      select 1 from bills
      where bills.id = bill_items.bill_id
        and (is_admin() or bills.created_by = auth.uid())
    )
  );
create policy "admin can update bill_items" on bill_items
  for update using (is_admin()) with check (is_admin());
create policy "admin can delete bill_items" on bill_items
  for delete using (is_admin());

-- Atomically saves a bill + its line items and deducts sold quantity from
-- stock, so a half-saved bill can never happen and stock can't drift.
-- p_items shape: [{ "product_id": "...", "product_name": "...", "product_name_ml": "...",
--   "product_name_hi": "...", "unit_price": 0, "quantity": 0, "line_total": 0 }, ...]
-- security definer: staff can create bills (insert policies already allow
-- this) but products can only be updated by admins per the policies above.
-- Running as definer lets the stock deduction below happen for staff too,
-- since it's a narrow, controlled side effect of billing rather than open
-- product editing.
create or replace function create_bill(
  p_customer_name text,
  p_rate_type text,
  p_items jsonb
) returns bills
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bill bills;
  v_total numeric := 0;
  item jsonb;
begin
  select coalesce(sum((i->>'line_total')::numeric), 0) into v_total
  from jsonb_array_elements(p_items) i;

  insert into bills (customer_name, rate_type, total)
  values (nullif(trim(p_customer_name), ''), p_rate_type, v_total)
  returning * into v_bill;

  for item in select * from jsonb_array_elements(p_items)
  loop
    insert into bill_items (
      bill_id, product_id, product_name, product_name_ml, product_name_hi,
      unit_price, quantity, line_total
    )
    values (
      v_bill.id,
      (item->>'product_id')::uuid,
      item->>'product_name',
      item->>'product_name_ml',
      item->>'product_name_hi',
      (item->>'unit_price')::numeric,
      (item->>'quantity')::numeric,
      (item->>'line_total')::numeric
    );

    update products
    set stock = stock - (item->>'quantity')::numeric
    where id = (item->>'product_id')::uuid;
  end loop;

  return v_bill;
end;
$$;

revoke all on function create_bill(text, text, jsonb) from public;
grant execute on function create_bill(text, text, jsonb) to authenticated;

-- Atomically logs a stock delivery/restock and bumps the product's running stock.
create or replace function add_stock(
  p_product_id uuid,
  p_entry_date date,
  p_quantity numeric
) returns stock_entries
language plpgsql
security invoker
as $$
declare
  v_entry stock_entries;
begin
  insert into stock_entries (product_id, entry_date, quantity)
  values (p_product_id, p_entry_date, p_quantity)
  returning * into v_entry;

  update products
  set stock = stock + p_quantity
  where id = p_product_id;

  return v_entry;
end;
$$;

revoke all on function add_stock(uuid, date, numeric) from public;
grant execute on function add_stock(uuid, date, numeric) to authenticated;

-- If you ran the earlier single-price version of this schema, drop it first:
-- drop table if exists bill_items cascade;
-- drop table if exists bills cascade;
-- drop table if exists stock_entries cascade;
-- drop table if exists products cascade;
-- drop function if exists create_bill(text, text, jsonb);
-- drop function if exists add_stock(uuid, date, numeric);
