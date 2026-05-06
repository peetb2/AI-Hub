-- Chat sessions table to store history
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New Conversation',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.chat_sessions enable row level security;

-- Policies
drop policy if exists "Users can view their own chat sessions" on public.chat_sessions;
create policy "Users can view their own chat sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own chat sessions" on public.chat_sessions;
create policy "Users can insert their own chat sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own chat sessions" on public.chat_sessions;
create policy "Users can update their own chat sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own chat sessions" on public.chat_sessions;
create policy "Users can delete their own chat sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- Update trigger
drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at
before update on public.chat_sessions
for each row execute procedure public.set_updated_at();
