create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  monthly_token_quota int not null default 100000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key_name text not null default 'code-assistant',
  key_value text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  revoked_at timestamptz null,
  unique (user_id, key_name)
);

alter table public.user_keys
  drop constraint if exists user_keys_user_id_fkey;

alter table public.user_keys
  add constraint user_keys_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.profiles enable row level security;
alter table public.user_keys enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop policy if exists "profiles read own row" on public.profiles;
create policy "profiles read own row"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles update own row" on public.profiles;
create policy "profiles update own row"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles insert own row" on public.profiles;
create policy "profiles insert own row"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles admin read all" on public.profiles;
create policy "profiles admin read all"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

drop policy if exists "profiles admin update any" on public.profiles;
create policy "profiles admin update any"
  on public.profiles
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

drop policy if exists "user_keys read own rows" on public.user_keys;
create policy "user_keys read own rows"
  on public.user_keys
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_keys insert own rows" on public.user_keys;
create policy "user_keys insert own rows"
  on public.user_keys
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_keys update own rows" on public.user_keys;
create policy "user_keys update own rows"
  on public.user_keys
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_keys delete own rows" on public.user_keys;
create policy "user_keys delete own rows"
  on public.user_keys
  for delete
  using (auth.uid() = user_id);

create table if not exists public.user_ai_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'personal',
  token_prefix text not null,
  token_encrypted text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz null,
  unique (user_id)
);

create index if not exists user_ai_tokens_user_id_idx on public.user_ai_tokens (user_id);

alter table public.user_ai_tokens enable row level security;

drop trigger if exists user_ai_tokens_set_updated_at on public.user_ai_tokens;
create trigger user_ai_tokens_set_updated_at
before update on public.user_ai_tokens
for each row execute procedure public.set_updated_at();

drop policy if exists "user_ai_tokens read own rows" on public.user_ai_tokens;
create policy "user_ai_tokens read own rows"
  on public.user_ai_tokens
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_ai_tokens insert own rows" on public.user_ai_tokens;
create policy "user_ai_tokens insert own rows"
  on public.user_ai_tokens
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_ai_tokens update own rows" on public.user_ai_tokens;
create policy "user_ai_tokens update own rows"
  on public.user_ai_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_ai_tokens delete own rows" on public.user_ai_tokens;
create policy "user_ai_tokens delete own rows"
  on public.user_ai_tokens
  for delete
  using (auth.uid() = user_id);

drop policy if exists "user_ai_tokens admin read all" on public.user_ai_tokens;
create policy "user_ai_tokens admin read all"
  on public.user_ai_tokens
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

drop policy if exists "user_ai_tokens admin delete any" on public.user_ai_tokens;
create policy "user_ai_tokens admin delete any"
  on public.user_ai_tokens
  for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Token usage tracking table
create table if not exists public.token_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  characters_used int not null,
  request_context text,
  created_at timestamptz not null default now()
);

create index if not exists token_usage_user_id_idx on public.token_usage (user_id);
create index if not exists token_usage_created_at_idx on public.token_usage (created_at);

alter table public.token_usage enable row level security;

drop policy if exists "token_usage owner read" on public.token_usage;
create policy "token_usage owner read"
  on public.token_usage
  for select
  using (auth.uid() = user_id);

drop policy if exists "token_usage admin read all" on public.token_usage;
create policy "token_usage admin read all"
  on public.token_usage
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key_prefix text not null unique,
  key_hash text not null,
  allowed_model text not null default 'glm-4.7-flash',
  is_active boolean not null default true,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz null
);

create table if not exists public.api_key_usage (
  id bigint generated always as identity primary key,
  api_key_id uuid not null references public.api_keys (id) on delete cascade,
  model text not null,
  status_code int not null,
  request_at timestamptz not null default now()
);

create index if not exists api_keys_user_id_idx on public.api_keys (user_id);
create index if not exists api_key_usage_api_key_id_idx on public.api_key_usage (api_key_id);

alter table public.api_keys enable row level security;
alter table public.api_key_usage enable row level security;

drop policy if exists "api_keys owner read" on public.api_keys;
create policy "api_keys owner read"
  on public.api_keys
  for select
  using (auth.uid() = user_id);

drop policy if exists "api_key_usage owner read" on public.api_key_usage;
create policy "api_key_usage owner read"
  on public.api_key_usage
  for select
  using (
    exists (
      select 1
      from public.api_keys k
      where k.id = api_key_usage.api_key_id
      and k.user_id = auth.uid()
    )
  );